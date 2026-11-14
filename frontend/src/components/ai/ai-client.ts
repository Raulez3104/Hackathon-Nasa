import type { AIRequest, AIResponse } from "../../../../shared/types/geoqocha";

export const AI_ANALYST_ENDPOINT = "/api/ai-analyst";

export const MAX_QUESTION_LENGTH = 500;

export type AIClientErrorCode =
  | "INVALID_AI_REQUEST"
  | "CONTEXT_NOT_FOUND"
  | "RATE_LIMITED"
  | "AI_NOT_CONFIGURED"
  | "UPSTREAM_ERROR"
  | "UPSTREAM_TIMEOUT"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export class AIClientError extends Error {
  readonly code: AIClientErrorCode;
  readonly status: number | null;

  constructor(code: AIClientErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = "AIClientError";
    this.code = code;
    this.status = status;
  }
}

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return typeof value === "object" && value != null && "error" in value;
}

export function isAIResponse(value: unknown): value is AIResponse {
  if (typeof value !== "object" || value == null) return false;
  const candidate = value as Partial<AIResponse>;
  return (
    typeof candidate.answer === "string" &&
    candidate.answer.trim().length > 0 &&
    Array.isArray(candidate.citations) &&
    typeof candidate.disclaimer === "string" &&
    (candidate.mode === "chat" || candidate.mode === "diagnosis") &&
    typeof candidate.fallback_used === "boolean"
  );
}

/**
 * Errores en los que el contrato pide usar el fallback local del cliente
 * (sin proveedor configurado o sin red), en lugar de mostrar solo un error.
 */
export function shouldUseLocalFallback(error: unknown): boolean {
  if (!(error instanceof AIClientError)) return false;
  return error.code === "AI_NOT_CONFIGURED" || error.code === "NETWORK_ERROR";
}

export interface PostAIRequestOptions {
  endpoint?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AIClientError("INVALID_RESPONSE", "La respuesta del copiloto no es JSON válido.", response.status);
  }
}

/**
 * Envía una solicitud al endpoint del copiloto y normaliza los errores del
 * contrato. No conoce ni transporta credenciales: solo llama a nuestra API.
 */
export async function postAIRequest(
  request: AIRequest,
  { endpoint = AI_ANALYST_ENDPOINT, fetchImpl = fetch, signal }: PostAIRequestOptions = {},
): Promise<AIResponse> {
  const body: AIRequest = {
    ...request,
    locale: request.locale ?? "es",
  };
  if (body.question != null && body.question.length > MAX_QUESTION_LENGTH) {
    throw new AIClientError(
      "INVALID_AI_REQUEST",
      `La pregunta supera los ${MAX_QUESTION_LENGTH} caracteres permitidos.`,
    );
  }

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AIClientError("NETWORK_ERROR", "No se pudo contactar al copiloto. Revisa la conexión.");
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    const envelope = isErrorEnvelope(payload) ? payload.error : undefined;
    const code = (envelope?.code ?? "UPSTREAM_ERROR") as AIClientErrorCode;
    const message = envelope?.message ?? `El copiloto respondió con HTTP ${response.status}.`;
    throw new AIClientError(code, message, response.status);
  }

  if (!isAIResponse(payload)) {
    throw new AIClientError("INVALID_RESPONSE", "La respuesta del copiloto no cumple el contrato.", response.status);
  }

  return payload;
}
