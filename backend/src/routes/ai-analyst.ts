import { Router } from "express";

import { analyzeAI } from "../ai/service.js";
import { store } from "../data/store.js";
import { ApiError, asyncHandler } from "../http/errors.js";
import type { AIRequest } from "../types/geoqocha.js";

export const aiAnalystRouter = Router();

function invalid(message: string, details?: unknown): never {
  throw new ApiError(400, "INVALID_AI_REQUEST", message, details);
}

export function parseAIRequest(body: unknown): AIRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    invalid("El cuerpo de la solicitud debe ser un objeto JSON.");
  }
  const payload = body as Record<string, unknown>;
  if (payload.mode !== "chat" && payload.mode !== "diagnosis") {
    invalid("El campo mode debe ser chat o diagnosis.");
  }
  const mode = payload.mode;

  let districtId: number | undefined;
  if (payload.district_id !== undefined && payload.district_id !== null) {
    if (!Number.isInteger(payload.district_id)) {
      invalid("district_id debe ser un entero.");
    }
    districtId = payload.district_id as number;
    if (!store.getDistrict(districtId)) {
      invalid(`No existe el distrito ${districtId}.`, { district_id: districtId });
    }
  }
  if (mode === "diagnosis" && districtId === undefined) {
    invalid("El modo diagnosis requiere district_id.");
  }

  let year: number | undefined;
  if (payload.year !== undefined && payload.year !== null) {
    if (!Number.isInteger(payload.year)) invalid("year debe ser un entero.");
    year = payload.year as number;
    const lastDataYear = store.getLastDataYear();
    const minYear = store.getYears()[0] ?? 2015;
    if (year < minYear || year > (lastDataYear ?? year)) {
      invalid(`year debe estar entre ${minYear} y ${lastDataYear ?? year}.`, { year, minYear, maxYear: lastDataYear });
    }
  }

  let question: string | undefined;
  if (payload.question !== undefined && payload.question !== null) {
    if (typeof payload.question !== "string") invalid("question debe ser texto.");
    question = payload.question.trim();
    if (question.length === 0) invalid("question no puede estar vacía.");
    if (question.length > 500) invalid("question no puede superar 500 caracteres.");
  }
  if (mode === "chat" && !question) {
    invalid("El modo chat requiere question.");
  }

  if (payload.locale !== undefined && payload.locale !== null && payload.locale !== "es") {
    invalid("El MVP solo admite locale es.");
  }

  return {
    mode,
    ...(districtId !== undefined ? { district_id: districtId } : {}),
    ...(year !== undefined ? { year } : {}),
    ...(question !== undefined ? { question } : {}),
    locale: "es",
  };
}

aiAnalystRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const payload = parseAIRequest(request.body);
    const clientKey = request.ip ?? request.socket.remoteAddress ?? "unknown";
    const result = await analyzeAI(payload, clientKey);
    response.json(result);
  }),
);
