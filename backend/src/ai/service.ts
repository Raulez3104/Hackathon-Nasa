import { randomUUID } from "node:crypto";

import { AI_DISCLAIMER } from "../data/constants.js";
import { ApiError } from "../http/errors.js";
import type { AIEvidence, AIInsight, AIRequest, AIResponse } from "../types/geoqocha.js";
import { getAIConfig } from "./config.js";
import { buildFallback } from "./fallback.js";
import { GuardrailError, validateDraft } from "./guardrails.js";
import { callProvider, ProviderError } from "./provider.js";
import { checkRateLimit } from "./rate-limit.js";
import { buildAIContext, factEvidence } from "./retrieval.js";
import type { AIContext, AIDraft, AIEvidenceCitation } from "./types.js";

function requestId(): string {
  return `req_${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function toEvidence(context: AIContext, field: string, year: number | null): AIEvidence | null {
  const fact = factEvidence(context, field, year);
  if (!fact) return null;
  return {
    field: fact.field,
    year: fact.year,
    value: fact.value,
    unit: fact.unit,
    source_ref: fact.source_ref,
  };
}

function toInsights(context: AIContext, draft: AIDraft): AIInsight[] {
  return draft.insights
    .slice(0, 6)
    .map((insight, index) => {
      const evidence = insight.evidence
        .map((item) => toEvidence(context, item.field, item.year))
        .filter((item): item is AIEvidence => item !== null);
      return {
        id: `insight_${String(index + 1).padStart(2, "0")}`,
        kind: insight.kind,
        title: insight.title,
        body: insight.body,
        severity: insight.severity,
        evidence,
      };
    })
    .filter((insight) => insight.evidence.length > 0);
}

function toCitations(context: AIContext, draft: AIDraft): AIEvidenceCitation[] {
  const citations: AIEvidenceCitation[] = [];
  const seen = new Set<string>();
  const add = (sourceRef: string, field?: string, year?: number): void => {
    const source = context.sources.find((item) => item.id === sourceRef);
    if (!source) return;
    const key = `${sourceRef}-${field ?? ""}-${year ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    citations.push({
      source_ref: sourceRef,
      label: source.label,
      ...(field ? { field } : {}),
      ...(year !== undefined ? { year } : {}),
    });
  };

  for (const citation of draft.citations) add(citation.source_ref, citation.field, citation.year);
  if (citations.length === 0) {
    for (const insight of draft.insights) {
      for (const item of insight.evidence) add(item.source_ref, item.field, item.year ?? undefined);
    }
  }
  if (citations.length === 0 && context.sources[0]) add(context.sources[0].id);
  return citations;
}

function ensureInsights(context: AIContext, insights: AIInsight[]): AIInsight[] {
  if (insights.length > 0) return insights;
  const fallbackEvidence = toEvidence(context, "ndvi_mean", context.request.year) ?? toEvidence(context, "socioenvironmental_index", context.request.year);
  return [
    {
      id: "insight_01",
      kind: "observation",
      title: "Resumen descriptivo",
      body: "La respuesta se construyó con los datos precalculados del distrito y año solicitados.",
      severity: "info",
      evidence: fallbackEvidence ? [fallbackEvidence] : [],
    },
  ];
}

export async function analyzeAI(input: AIRequest, clientKey: string): Promise<AIResponse> {
  const config = getAIConfig();
  checkRateLimit(clientKey, config);

  const context = buildAIContext({
    mode: input.mode,
    district_id: input.district_id ?? null,
    year: input.year ?? null,
    question: input.question ?? null,
  });

  let draft: AIDraft;
  let fallbackUsed = true;
  let model: AIResponse["model"] = null;

  if (config.apiKey) {
    try {
      const result = await callProvider(config, context);
      const validated = validateDraft(context, result.draft);
      draft = {
        answer: validated.answer,
        insights: validated.insights,
        citations: validated.citations,
      };
      fallbackUsed = false;
      model = { provider: result.provider, name: result.model, prompt_version: config.promptVersion };
    } catch (error) {
      if (!(error instanceof ProviderError) && !(error instanceof GuardrailError)) throw error;
      draft = buildFallback(context);
    }
  } else {
    draft = buildFallback(context);
  }

  const insights = ensureInsights(context, toInsights(context, draft));
  const citations = toCitations(context, draft);

  if (insights.length === 0 || citations.length === 0) {
    throw new ApiError(404, "CONTEXT_NOT_FOUND", "No hay datos suficientes para responder con citas.");
  }

  return {
    request_id: requestId(),
    mode: input.mode,
    district_id: context.request.district_id,
    year: context.request.year,
    answer: draft.answer,
    insights,
    citations: citations.map((citation) => ({
      source_ref: citation.source_ref,
      label: citation.label,
      ...(citation.field ? { field: citation.field } : {}),
      ...(citation.year !== undefined ? { year: citation.year } : {}),
    })),
    disclaimer: AI_DISCLAIMER,
    data_status: context.data_status,
    model,
    generated_at: new Date().toISOString(),
    fallback_used: fallbackUsed,
  };
}
