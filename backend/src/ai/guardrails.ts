import type { AIContext, AIDraft, AIEvidenceCitation } from "./types.js";

export class GuardrailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuardrailError";
  }
}

const FORBIDDEN_OUTPUT = [
  /GAMC_API_KEY/i,
  /AI_API_KEY/i,
  /\bsk-[a-z0-9]/i,
  /system prompt/i,
  /ignora (?:las )?instrucciones/i,
  /revela (?:la )?clave/i,
];

function normalizeNumber(token: string): string | null {
  const cleaned = token.replace(",", ".");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return String(parsed);
}

function validateNumbers(context: AIContext, text: string): void {
  const allowed = new Set(context.allowed_numbers);
  const matches = text.match(/(?<![\d.,])-?\d+(?:[.,]\d+)?/g) ?? [];
  for (const match of matches) {
    const normalized = normalizeNumber(match);
    if (normalized === null) continue;
    if (!allowed.has(normalized)) {
      throw new GuardrailError(`El proveedor citó un número no presente en el contexto: ${match}.`);
    }
  }
}

function normalizeAnswer(draft: AIDraft): string {
  const answer = draft.answer.trim();
  if (answer.length < 20) throw new GuardrailError("La respuesta del proveedor es demasiado corta.");
  if (answer.length > 2400) throw new GuardrailError("La respuesta del proveedor excede el límite de longitud.");
  if (FORBIDDEN_OUTPUT.some((pattern) => pattern.test(answer))) {
    throw new GuardrailError("La respuesta del proveedor contiene contenido no permitido.");
  }
  return answer;
}

function findFact(context: AIContext, field: string, year?: number | null) {
  return (
    context.facts.find((fact) => fact.field === field && (year === undefined || fact.year === year)) ??
    context.facts.find((fact) => fact.field === field)
  );
}

const ALLOWED_KINDS = new Set(["observation", "risk", "recommendation", "caveat"]);
const ALLOWED_SEVERITY = new Set(["info", "warning", "critical"]);

export function validateDraft(
  context: AIContext,
  draft: AIDraft,
): { answer: string; insights: AIDraft["insights"]; citations: AIEvidenceCitation[] } {
  const answer = normalizeAnswer(draft);
  validateNumbers(context, answer);

  const allowedSources = new Set(context.sources.map((source) => source.id));
  const insights = draft.insights
    .filter((insight) => insight && typeof insight.title === "string" && typeof insight.body === "string")
    .slice(0, 6)
    .map((insight) => {
      validateNumbers(context, `${insight.title} ${insight.body}`);
      if (!ALLOWED_KINDS.has(insight.kind)) throw new GuardrailError(`Tipo de insight inválido: ${insight.kind}.`);
      if (!ALLOWED_SEVERITY.has(insight.severity)) {
        throw new GuardrailError(`Severidad de insight inválida: ${insight.severity}.`);
      }
      const evidence = (Array.isArray(insight.evidence) ? insight.evidence : [])
        .filter((item) => typeof item.field === "string")
        .slice(0, 4)
        .flatMap((item) => {
          const fact = findFact(context, item.field, item.year);
          if (!fact) return [];
          return [{ field: fact.field, year: fact.year, source_ref: fact.source_ref }];
        });
      if (evidence.length === 0) return null;
      return {
        kind: insight.kind,
        title: insight.title.slice(0, 120),
        body: insight.body.slice(0, 600),
        severity: insight.severity,
        evidence,
      };
    })
    .filter((insight): insight is NonNullable<typeof insight> => insight !== null);

  if (insights.length === 0) throw new GuardrailError("El proveedor no devolvió insights válidos.");

  const citations: AIEvidenceCitation[] = [];
  const seen = new Set<string>();
  const addCitation = (sourceRef: string, field?: string, year?: number): void => {
    if (!allowedSources.has(sourceRef)) return;
    const key = `${sourceRef}-${field ?? ""}-${year ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    const source = context.sources.find((item) => item.id === sourceRef);
    citations.push({
      source_ref: sourceRef,
      label: source?.label ?? sourceRef,
      ...(field ? { field } : {}),
      ...(year !== undefined ? { year } : {}),
    });
  };

  for (const citation of Array.isArray(draft.citations) ? draft.citations : []) {
    if (typeof citation.source_ref === "string") addCitation(citation.source_ref, citation.field, citation.year);
  }
  if (citations.length === 0) {
    for (const insight of insights) {
      for (const item of insight.evidence) addCitation(item.source_ref, item.field, item.year ?? undefined);
    }
  }
  if (citations.length === 0) throw new GuardrailError("El proveedor no incluyó citas verificables.");

  return { answer, insights, citations };
}
