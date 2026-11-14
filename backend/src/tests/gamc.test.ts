import assert from "node:assert/strict";
import test from "node:test";
import type { Request } from "express";

import {
  cacheTtlMs,
  parseWmsQuery,
  readWmsConfig,
  toUpstreamParams,
  WmsValidationError,
} from "../gamc/wms.js";

const ALLOWED_ID = "97a589fe-595e-45dd-91d4-38524877f1ed";
const OTHER_ID = "47360ddc-e35f-4ece-a995-59e90eb79cc6";

const config = readWmsConfig({
  GAMC_WMS_URL: "https://serviciosgamc.cochabamba.bo/api/gs/wms",
  GAMC_API_KEY: "clave-de-prueba",
  GAMC_ALLOWED_SERVICE_IDS: `${ALLOWED_ID}, ${OTHER_ID}`,
  GAMC_WMS_TIMEOUT_MS: "5000",
  GAMC_WMS_RATE_LIMIT: "30",
});

function request(query: Record<string, string>): Request {
  return { query } as unknown as Request;
}

const GET_MAP = {
  service_id: ALLOWED_ID,
  REQUEST: "GetMap",
  VERSION: "1.1.1",
  FORMAT: "image/png",
  SRS: "EPSG:3857",
  BBOX: "-7400000,-1970000,-7350000,-1950000",
  WIDTH: "256",
  HEIGHT: "256",
};

test("lee la lista blanca y los límites desde el entorno", () => {
  assert.deepEqual([...config.allowedServiceIds].sort(), [ALLOWED_ID, OTHER_ID].sort());
  assert.equal(config.timeoutMs, 5000);
  assert.equal(config.rateLimitPerMinute, 30);
});

test("rechaza un service_id fuera de la lista blanca", () => {
  assert.throws(
    () => parseWmsQuery(request({ ...GET_MAP, service_id: "00000000-0000-0000-0000-000000000000" }), config),
    (error: unknown) => error instanceof WmsValidationError && error.status === 403 && error.code === "SERVICE_NOT_ALLOWED",
  );
});

test("rechaza operaciones WMS no permitidas", () => {
  assert.throws(
    () => parseWmsQuery(request({ ...GET_MAP, REQUEST: "GetCapabilities" }), config),
    (error: unknown) => error instanceof WmsValidationError && error.code === "OPERATION_NOT_ALLOWED",
  );
});

test("inyecta la clave solo del lado servidor", () => {
  const query = parseWmsQuery(request(GET_MAP), config);
  const upstream = toUpstreamParams(query, config);
  assert.equal(upstream.get("key"), "clave-de-prueba");
  assert.equal(upstream.get("service_id"), ALLOWED_ID);
  assert.equal(upstream.has("GAMC_API_KEY"), false);
});

test("exige BBOX, WIDTH y HEIGHT para GetMap", () => {
  const { BBOX: _bbox, ...withoutBbox } = GET_MAP;
  assert.throws(
    () => parseWmsQuery(request(withoutBbox), config),
    (error: unknown) => error instanceof WmsValidationError && error.code === "INVALID_PARAMETER",
  );
});

test("define TTL de caché por operación", () => {
  const getMap = parseWmsQuery(request(GET_MAP), config);
  const legend = parseWmsQuery(
    request({ service_id: ALLOWED_ID, REQUEST: "GetLegendGraphic", VERSION: "1.0.0", FORMAT: "image/png" }),
    config,
  );
  assert.ok(cacheTtlMs(legend) > cacheTtlMs(getMap));
});
