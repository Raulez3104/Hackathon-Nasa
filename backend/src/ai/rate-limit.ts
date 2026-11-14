import type { AIConfig } from "./config.js";
import { ApiError } from "../http/errors.js";

const hits = new Map<string, number[]>();

export function checkRateLimit(clientKey: string, config: AIConfig): void {
  const now = Date.now();
  const windowStart = now - config.rateLimitWindowMs;
  const timestamps = (hits.get(clientKey) ?? []).filter((timestamp) => timestamp >= windowStart);
  if (timestamps.length >= config.rateLimitMax) {
    throw new ApiError(429, "RATE_LIMITED", "Se superó el límite de consultas. Intente nuevamente en un minuto.", {
      limit: config.rateLimitMax,
      window_ms: config.rateLimitWindowMs,
    });
  }
  timestamps.push(now);
  hits.set(clientKey, timestamps);

  if (hits.size > 1000) {
    for (const [key, values] of hits) {
      if (values.every((timestamp) => timestamp < windowStart)) hits.delete(key);
    }
  }
}
