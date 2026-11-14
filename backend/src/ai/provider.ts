import type { AIConfig } from "./config.js";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts.js";
import type { AIContext, AIDraft, AIProviderResult } from "./types.js";

export class ProviderError extends Error {
  constructor(
    public readonly kind: "timeout" | "upstream" | "invalid_response" | "not_configured",
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

async function requestWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError("timeout", "El proveedor de IA no respondió en el tiempo máximo.");
    }
    throw new ProviderError("upstream", "No se pudo conectar con el proveedor de IA.");
  } finally {
    clearTimeout(timer);
  }
}

function extractJson(text: string): AIDraft {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new ProviderError("invalid_response", "El proveedor no devolvió JSON válido.");
  }
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as AIDraft;
    if (!parsed || typeof parsed.answer !== "string") {
      throw new ProviderError("invalid_response", "El JSON del proveedor no contiene una respuesta.");
    }
    return {
      answer: parsed.answer,
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
    };
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("invalid_response", "El JSON del proveedor no se pudo interpretar.");
  }
}

async function callGemini(config: AIConfig, context: AIContext): Promise<{ text: string }> {
  if (!config.apiKey) throw new ProviderError("not_configured", "No hay proveedor configurado.");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  const response = await requestWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: buildUserPrompt(context) }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: config.maxOutputTokens,
          responseMimeType: "application/json",
        },
      }),
    },
    config.timeoutMs,
  );

  if (!response.ok) {
    throw new ProviderError("upstream", `El proveedor Gemini respondió ${response.status}.`, response.status);
  }
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text) throw new ProviderError("invalid_response", "Gemini no devolvió contenido.");
  return { text };
}

async function callOpenAI(config: AIConfig, context: AIContext): Promise<{ text: string }> {
  if (!config.apiKey) throw new ProviderError("not_configured", "No hay proveedor configurado.");
  const response = await requestWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(context) },
        ],
        temperature: 0.2,
        max_tokens: config.maxOutputTokens,
        response_format: { type: "json_object" },
      }),
    },
    config.timeoutMs,
  );

  if (!response.ok) {
    throw new ProviderError("upstream", `El proveedor OpenAI respondió ${response.status}.`, response.status);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new ProviderError("invalid_response", "OpenAI no devolvió contenido.");
  return { text };
}

export async function callProvider(config: AIConfig, context: AIContext): Promise<AIProviderResult> {
  if (!config.apiKey) {
    throw new ProviderError("not_configured", "No hay AI_API_KEY configurada.");
  }

  let lastError: ProviderError | null = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const { text } = config.provider === "openai" ? await callOpenAI(config, context) : await callGemini(config, context);
      return {
        draft: extractJson(text),
        provider: config.provider,
        model: config.model,
      };
    } catch (error) {
      if (!(error instanceof ProviderError)) throw error;
      lastError = error;
      if (error.kind === "not_configured" || error.kind === "invalid_response") break;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw lastError ?? new ProviderError("upstream", "El proveedor de IA falló.");
}
