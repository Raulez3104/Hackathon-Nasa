import type { DistrictData, DistrictTrend } from "../../../../shared/types/geoqocha";
import { equipmentValue, seriesPointForYear, trendFor } from "./stats";

/**
 * Reglas deterministas y explicables para el ranking de hotspots del MVP.
 * El backend es el dueño de esta clasificación; este módulo solo reproduce
 * las reglas publicadas para la vista de desarrollo cuando el endpoint aún
 * no está disponible. No usa IA ni imputa valores.
 */

export const HOTSPOTS_DISCLAIMER =
  "Clasificación indicativa basada en reglas explícitas. No es una evaluación oficial del GAMC ni una priorización de inversión.";

export const HOTSPOT_METHODOLOGY_VERSION = "0.1.0";

export type PriorityLevel = "high" | "medium" | "low";

export type HotspotVariable = "ndvi" | "lst" | "equipment" | "index" | "mobility";

export interface HotspotRule {
  rule_id: string;
  variable: HotspotVariable;
  description: string;
  observed_value: number | null;
  threshold: number | null;
  unit: string;
  triggered: boolean;
  /** Puntos que aporta la regla al puntaje cuando se activa. */
  contribution: number;
}

export interface HotspotContribution {
  variable: HotspotVariable;
  label: string;
  points: number;
  triggered: boolean;
}

export interface HotspotEntry {
  district_id: number;
  district_name: string;
  year: number | null;
  priority_level: PriorityLevel;
  score: number;
  rules: HotspotRule[];
  contributions: HotspotContribution[];
  explanation: string;
  data_status: DistrictData["data_status"];
}

export interface HotspotCollection {
  year: number | null;
  methodology_version: string;
  disclaimer: string;
  hotspots: HotspotEntry[];
  /** `true` cuando el ranking se derivó en el cliente por falta de endpoint. */
  computed_locally: boolean;
  evaluated_districts: number;
}

interface RuleDefinition {
  id: string;
  variable: HotspotVariable;
  label: string;
  description: string;
  points: number;
  threshold: number | null;
  unit: string;
  evaluate: (district: DistrictData, year: number | null) => { observed: number | null; triggered: boolean };
}

function slopeOf(trend: DistrictTrend | null): number | null {
  return trend?.slope_per_year != null && Number.isFinite(trend.slope_per_year) ? trend.slope_per_year : null;
}

const RULES: RuleDefinition[] = [
  {
    id: "NDVI_NEGATIVE_TREND",
    variable: "ndvi",
    label: "NDVI",
    description: "Tendencia de NDVI negativa por debajo del umbral.",
    points: 25,
    threshold: -0.002,
    unit: "NDVI/año",
    evaluate: (district) => {
      const trend = trendFor(district, "ndvi");
      const slope = slopeOf(trend);
      const triggered = slope != null ? slope < -0.002 : trend?.direction === "worsening";
      return { observed: slope, triggered };
    },
  },
  {
    id: "LST_POSITIVE_TREND",
    variable: "lst",
    label: "LST",
    description: "Tendencia de LST positiva por encima del umbral.",
    points: 25,
    threshold: 0.1,
    unit: "°C/año",
    evaluate: (district) => {
      const trend = trendFor(district, "lst");
      const slope = slopeOf(trend);
      const triggered = slope != null ? slope > 0.1 : trend?.direction === "worsening";
      return { observed: slope, triggered };
    },
  },
  {
    id: "EQUIPMENT_DEFICIT",
    variable: "equipment",
    label: "Equipamiento",
    description: "Área verde por habitante por debajo del umbral.",
    points: 20,
    threshold: 4,
    unit: "m²/hab.",
    evaluate: (district) => {
      const value = equipmentValue(district, "green_area_m2_per_capita");
      const flagged = district.equipment.deficit_flags.includes("GREEN_AREA_LOW");
      return { observed: value, triggered: value != null ? value < 4 : flagged };
    },
  },
  {
    id: "ICVSA_LOW",
    variable: "index",
    label: "ICVSA",
    description: "ICVSA por debajo del umbral de atención.",
    points: 20,
    threshold: 40,
    unit: "índice 1–100",
    evaluate: (district, year) => {
      const point = seriesPointForYear(district, year);
      const value = point?.socioenvironmental_index ?? null;
      return { observed: value, triggered: value != null && value < 40 };
    },
  },
  {
    id: "MOBILITY_LOW",
    variable: "mobility",
    label: "Movilidad",
    description: "Acceso a movilidad por debajo del umbral.",
    points: 10,
    threshold: 40,
    unit: "índice 1–100",
    evaluate: (district) => {
      const value = equipmentValue(district, "mobility_access_index");
      return { observed: value, triggered: value != null && value < 40 };
    },
  },
];

export function priorityForScore(score: number): PriorityLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export function priorityLabel(priority: PriorityLevel): string {
  switch (priority) {
    case "high":
      return "Prioridad alta";
    case "medium":
      return "Prioridad media";
    default:
      return "Prioridad baja";
  }
}

/** El semáforo nunca depende solo del color (RN-09). */
export function priorityIcon(priority: PriorityLevel): string {
  switch (priority) {
    case "high":
      return "▼";
    case "medium":
      return "■";
    default:
      return "▲";
  }
}

export function evaluateHotspot(district: DistrictData, year: number | null): HotspotEntry {
  const rules: HotspotRule[] = RULES.map((rule) => {
    const result = rule.evaluate(district, year);
    return {
      rule_id: rule.id,
      variable: rule.variable,
      description: rule.description,
      observed_value: result.observed,
      threshold: rule.threshold,
      unit: rule.unit,
      triggered: result.triggered,
      contribution: result.triggered ? rule.points : 0,
    };
  });

  const score = rules.reduce((sum, rule) => sum + rule.contribution, 0);
  const triggered = rules.filter((rule) => rule.triggered);
  const variables = triggered.map((rule) => RULES.find((item) => item.id === rule.rule_id)?.label ?? rule.variable);

  return {
    district_id: district.district_id,
    district_name: district.name,
    year,
    priority_level: priorityForScore(score),
    score,
    rules,
    contributions: RULES.map((rule) => {
      const evaluated = rules.find((item) => item.rule_id === rule.id);
      return {
        variable: rule.variable,
        label: rule.label,
        points: evaluated?.contribution ?? 0,
        triggered: evaluated?.triggered ?? false,
      };
    }),
    explanation:
      triggered.length === 0
        ? "No activó reglas en el año consultado."
        : `Activa ${triggered.length} ${triggered.length === 1 ? "regla" : "reglas"} (${variables.join(
            ", ",
          )}); requiere análisis adicional. La clasificación es indicativa y no implica causalidad.`,
    data_status: district.data_status,
  };
}

const PRIORITY_ORDER: Record<PriorityLevel, number> = { high: 3, medium: 2, low: 1 };

/**
 * Construye el ranking local. Ignora distritos sin ninguna regla activada y
 * aplica el filtro `minPriority` del contrato.
 */
export function buildHotspotCollection(
  districts: DistrictData[],
  year: number | null,
  minPriority: PriorityLevel = "medium",
): HotspotCollection {
  const evaluated = districts.map((district) => evaluateHotspot(district, year));
  const hotspots = evaluated
    .filter((entry) => entry.score > 0)
    .filter((entry) => PRIORITY_ORDER[entry.priority_level] >= PRIORITY_ORDER[minPriority])
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.district_id - b.district_id;
    });

  return {
    year,
    methodology_version: HOTSPOT_METHODOLOGY_VERSION,
    disclaimer: HOTSPOTS_DISCLAIMER,
    hotspots,
    computed_locally: true,
    evaluated_districts: districts.length,
  };
}

export const HOTSPOT_RULES = RULES.map((rule) => ({
  id: rule.id,
  variable: rule.variable,
  label: rule.label,
  description: rule.description,
  points: rule.points,
  threshold: rule.threshold,
  unit: rule.unit,
}));

export interface HotspotVariableTotal {
  variable: HotspotVariable;
  label: string;
  points: number;
}

/** Contribución agregada por variable en el ranking visible (RF-29). */
export function contributionsByVariable(hotspots: HotspotEntry[]): HotspotVariableTotal[] {
  const totals = new Map<HotspotVariable, HotspotVariableTotal>();
  for (const hotspot of hotspots) {
    for (const contribution of hotspot.contributions) {
      if (!contribution.triggered) continue;
      const current = totals.get(contribution.variable);
      if (current) current.points += contribution.points;
      else totals.set(contribution.variable, {
        variable: contribution.variable,
        label: contribution.label,
        points: contribution.points,
      });
    }
  }
  return [...totals.values()].sort((a, b) => b.points - a.points);
}
