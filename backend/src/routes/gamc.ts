import type { Request, Response, Router } from "express";
import express from "express";
import { WmsCache } from "../gamc/cache.js";
import {
  cacheTtlMs,
  parseWmsQuery,
  readWmsConfig,
  toUpstreamParams,
  WmsValidationError,
  type WmsConfig,
} from "../gamc/wms.js";

const router: Router = express.Router();
const config = readWmsConfig();
const cache = new WmsCache();
const requestCounters = new Map<string, { count: number; windowStart: number }>();

router.get("/wms", async (request, response) => {
  try {
    const query = parseWmsQuery(request, config);
    if (!config.upstreamUrl) {
      sendError(response, 502, "UPSTREAM_ERROR", "El WMS del GAMC no está configurado.");
      return;
    }

    const upstreamParams = toUpstreamParams(query, config);
    const cacheKey = `${query.operation}:${upstreamParams.toString().replace(/key=[^&]+&?/, "")}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      sendPayload(response, cached.body, cached.contentType, true, cacheTtlMs(query));
      return;
    }
    enforceRateLimit(request);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    let upstream: globalThis.Response;
    try {
      upstream = await fetch(`${config.upstreamUrl}?${upstreamParams.toString()}`, {
        signal: controller.signal,
        headers: { Accept: query.operation === "GetFeatureInfo" ? "application/json" : "image/png" },
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === "AbortError") {
        sendError(response, 504, "UPSTREAM_TIMEOUT", "El WMS del GAMC no respondió a tiempo.");
      } else {
        sendError(response, 502, "UPSTREAM_ERROR", "No se pudo consultar el WMS del GAMC.");
      }
      return;
    }

    if (!upstream.ok) {
      clearTimeout(timeout);
      sendError(response, 502, "UPSTREAM_ERROR", "El WMS del GAMC devolvió un error.");
      return;
    }

    const contentType = upstream.headers.get("content-type")?.split(";")[0] ?? "";
    const expectedContentType = query.operation === "GetFeatureInfo" ? "application/json" : "image/png";
    if (!contentType.includes(expectedContentType)) {
      clearTimeout(timeout);
      sendError(response, 502, "UPSTREAM_ERROR", "El WMS devolvió un contenido no compatible.");
      return;
    }

    let body: Buffer;
    try {
      body = Buffer.from(await upstream.arrayBuffer());
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        sendError(response, 504, "UPSTREAM_TIMEOUT", "El WMS del GAMC no respondió a tiempo.");
      } else {
        sendError(response, 502, "UPSTREAM_ERROR", "No se pudo leer la respuesta del WMS del GAMC.");
      }
      return;
    } finally {
      clearTimeout(timeout);
    }
    if (body.byteLength > 8 * 1024 * 1024) {
      sendError(response, 502, "UPSTREAM_ERROR", "La respuesta del WMS supera el tamaño permitido.");
      return;
    }

    const ttl = cacheTtlMs(query);
    cache.set(cacheKey, { body, contentType }, ttl);
    sendPayload(response, body, contentType, false, ttl);
  } catch (error) {
    if (error instanceof WmsValidationError) {
      sendError(response, error.status, error.code, error.message);
      return;
    }
    sendError(response, 502, "UPSTREAM_ERROR", "Error inesperado del proxy WMS.");
  }
});

function enforceRateLimit(request: Request): void {
  const now = Date.now();
  const key = request.ip || request.socket.remoteAddress || "unknown";
  const current = requestCounters.get(key);
  if (!current || now - current.windowStart >= 60_000) {
    requestCounters.set(key, { count: 1, windowStart: now });
    return;
  }
  if (current.count >= config.rateLimitPerMinute) {
    throw new WmsValidationError(429, "RATE_LIMITED", "Límite de consultas WMS excedido.");
  }
  current.count += 1;
}

function sendPayload(response: Response, body: Buffer, contentType: string, cached: boolean, ttlMs: number): void {
  response.status(200);
  response.setHeader("Content-Type", contentType);
  response.setHeader("Cache-Control", `public, max-age=${Math.floor(ttlMs / 1000)}`);
  response.setHeader("X-Data-Source", "GAMC-WMS");
  response.setHeader("X-Proxy-Validated", "true");
  if (cached) response.setHeader("X-Proxy-Cache", "HIT");
  response.send(body);
}

function sendError(response: Response, status: number, code: string, message: string): void {
  response.status(status).json({ error: { code, message, details: {} } });
}

export { router as gamcRouter };
