export type AIProviderName = "gemini" | "openai";

export interface AIConfig {
  provider: AIProviderName;
  apiKey: string | null;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  promptVersion: string;
}

const DEFAULT_MODELS: Record<AIProviderName, string> = {
  gemini: "gemini-3.5-flash",
  openai: "gpt-4o-mini",
};

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase() === "openai" ? "openai" : "gemini";
  return {
    provider,
    apiKey: process.env.AI_API_KEY?.trim() || null,
    model: process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider],
    timeoutMs: positiveInteger(process.env.AI_TIMEOUT_MS, 20000),
    maxOutputTokens: positiveInteger(process.env.AI_MAX_OUTPUT_TOKENS, 800),
    rateLimitMax: positiveInteger(process.env.AI_RATE_LIMIT_MAX, 20),
    rateLimitWindowMs: positiveInteger(process.env.AI_RATE_LIMIT_WINDOW_MS, 60000),
    promptVersion: "0.1.0",
  };
}
