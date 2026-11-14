import type { AIContext } from "./types.js";

const DEFAULT_MAX_CHARS = 9000;
const CHARS_PER_TOKEN = 4;

function configuredMaxChars(): number {
  const parsed = Number(process.env.AI_CONTEXT_MAX_CHARS);
  return Number.isInteger(parsed) && parsed > 500 ? parsed : DEFAULT_MAX_CHARS;
}

function serialize(context: AIContext, facts: AIContext["facts"]): string {
  return JSON.stringify({
    district: context.district,
    year: context.request.year,
    municipal_average: context.municipal_average,
    hotspot: context.hotspot,
    trends: context.trends,
    facts: facts.map((fact) => ({
      field: fact.field,
      year: fact.year,
      value: fact.value,
      unit: fact.unit,
      source_ref: fact.source_ref,
    })),
    sources: context.sources,
    data_status: context.data_status,
  });
}

/**
 * Arma el contexto acotado que se envía al proveedor.
 * Prioriza hechos del año solicitado y recorta primero la serie histórica más antigua.
 */
export function buildContextText(context: AIContext, maxChars = configuredMaxChars()): string {
  const currentYear = context.request.year;
  const prioritized = [
    ...context.facts.filter((fact) => fact.year === currentYear),
    ...context.facts.filter((fact) => fact.year === null),
    ...context.facts.filter((fact) => fact.year !== currentYear && fact.year !== null),
  ];

  let text = serialize(context, prioritized);
  if (text.length <= maxChars) return text;

  const facts = [...prioritized];
  while (text.length > maxChars && facts.length > 1) {
    let removableIndex = -1;
    for (let index = facts.length - 1; index >= 0; index -= 1) {
      const fact = facts[index];
      if (fact.year !== null && fact.year !== currentYear && /_\d{4}$/.test(fact.key)) {
        removableIndex = index;
        break;
      }
    }
    if (removableIndex < 0) break;
    facts.splice(removableIndex, 1);
    text = serialize(context, facts);
  }

  return text.length <= maxChars ? text : text.slice(0, maxChars);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
