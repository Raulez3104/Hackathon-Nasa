import type { DistrictData } from "../../../../shared/types/geoqocha";
import { NOT_AVAILABLE, formatNdvi, formatPerCapita, formatSignedPercent } from "../analytics/format";
import {
  equipmentGap,
  municipalAverage,
  ndviChange,
  seriesPointForYear,
  trendFor,
  type GreenChange,
} from "../analytics/stats";

/** Nombres legibles de las fuentes declaradas por el dataset. */
export const SOURCE_LABELS: Record<string, string> = {
  mock: "Mock ilustrativo de desarrollo",
  nasa_mod13q1: "NASA MOD13Q1 · NDVI",
  nasa_mod11a2: "NASA MOD11A2 · LST",
  gamc_districts: "GAMC · límites distritales",
  gamc_equipment: "GAMC · equipamiento",
  gamc_transport: "GAMC · transporte",
};

export function sourceLabel(ref: string | null | undefined): string {
  if (!ref) return "Sin fuente declarada";
  return SOURCE_LABELS[ref] ?? ref.replaceAll("_", " ");
}

export type AwarenessDirection = "loss" | "gain" | "stable" | "insufficient";

export interface AwarenessIndicator {
  label: string;
  value: string;
  year: number | null;
}

export interface AwarenessStrategy {
  id: string;
  title: string;
  action: string;
  rationale: string;
  indicator: AwarenessIndicator;
  sourceRef: string;
  tone: "info" | "attention";
}

export interface AwarenessCitation {
  sourceRef: string;
  label: string;
  year: number | null;
  note: string;
}

export interface AwarenessMessage {
  id: string;
  text: string;
  basis: string;
}

export interface AwarenessAssessment {
  districtId: number;
  districtName: string;
  direction: AwarenessDirection;
  headline: string;
  change: GreenChange;
  strategies: AwarenessStrategy[];
  messages: AwarenessMessage[];
  citations: AwarenessCitation[];
  caveats: string[];
  dataStatus: DistrictData["data_status"];
  territorialReferenceYear: number | null;
}

function primarySource(district: DistrictData): string {
  return district.source_refs[0] ?? "";
}

function thresholdLabel(direction: AwarenessDirection): string {
  switch (direction) {
    case "loss":
      return "pérdida";
    case "gain":
      return "ganancia";
    case "stable":
      return "cambio estable";
    default:
      return "sin serie suficiente";
  }
}

function buildChangeIndicator(change: GreenChange): AwarenessIndicator {
  if (!change.available) {
    return { label: "NDVI medio", value: NOT_AVAILABLE, year: change.lastYear };
  }
  return {
    label: "NDVI medio",
    value: `${formatNdvi(change.firstValue)} → ${formatNdvi(change.lastValue)} (${
      change.relativePercent == null ? NOT_AVAILABLE : formatSignedPercent(change.relativePercent)
    })`,
    year: change.lastYear,
  };
}

function buildHeadline(district: DistrictData, direction: AwarenessDirection, change: GreenChange): string {
  if (!change.available) {
    return `${district.name}: no hay suficientes años con dato de NDVI para estimar un cambio de cobertura verde.`;
  }
  const period =
    change.firstYear != null && change.lastYear != null ? ` entre ${change.firstYear} y ${change.lastYear}` : "";
  return `${district.name}: ${thresholdLabel(direction)} de vigor vegetal (NDVI)${period}.`;
}

function buildCaveats(district: DistrictData): string[] {
  const caveats = [
    "El NDVI aproxima el vigor vegetal observado; no mide directamente hectáreas deforestadas ni cobertura boscosa.",
    "Las cifras describen el pasado observado en la serie. No demuestran causas ni permiten atribuir responsabilidades.",
  ];
  if (district.data_status === "illustrative") {
    caveats.push("Los valores de este conjunto son ilustrativos y no representan mediciones oficiales.");
  }
  if (district.data_status === "insufficient") {
    caveats.push("El distrito no cuenta con datos suficientes para todas las dimensiones; se muestran vacíos explícitos.");
  }
  return caveats;
}

function buildCitations(district: DistrictData, change: GreenChange): AwarenessCitation[] {
  const refs = district.source_refs.length > 0 ? district.source_refs : [""];
  const citations: AwarenessCitation[] = refs.map((ref) => ({
    sourceRef: ref,
    label: sourceLabel(ref),
    year: change.lastYear ?? district.latest_year,
    note:
      ref === "mock"
        ? "Serie de desarrollo; no usar como evidencia oficial."
        : "Fuente declarada por el dataset del distrito.",
  }));

  if (district.equipment.territorial_reference_year != null) {
    citations.push({
      sourceRef: "territorial_reference",
      label: "Año de referencia territorial",
      year: district.equipment.territorial_reference_year,
      note: "Equipamiento y movilidad no se interpolan a otros años.",
    });
  }
  return citations;
}

function ndviStrategies(
  district: DistrictData,
  direction: AwarenessDirection,
  change: GreenChange,
): AwarenessStrategy[] {
  const sourceRef = primarySource(district);
  const indicator = buildChangeIndicator(change);

  if (direction === "insufficient") {
    return [
      {
        id: "complete-series",
        title: "Completar la serie antes de concluir",
        action:
          "Priorizar la reobservación del distrito y documentar los años faltantes antes de difundir mensajes sobre deforestación.",
        rationale: "La serie no tiene al menos dos años válidos de NDVI, por lo que no se calcula un cambio.",
        indicator,
        sourceRef,
        tone: "info",
      },
    ];
  }

  if (direction === "loss") {
    return [
      {
        id: "monitor-loss",
        title: "Monitorear la pérdida de vigor vegetal",
        action:
          "Programar un seguimiento anual del NDVI en el distrito y contrastarlo con imágenes de mayor resolución antes de intervenir.",
        rationale: `El NDVI pasó de ${formatNdvi(change.firstValue)} a ${formatNdvi(change.lastValue)}; la caída observada es descriptiva, no causal.`,
        indicator,
        sourceRef,
        tone: "attention",
      },
      {
        id: "citizen-campaign",
        title: "Campaña de concientización sobre áreas verdes",
        action:
          "Difundir la serie del distrito en talleres barriales y vincularla con el cuidado de áreas verdes existentes.",
        rationale: "La evidencia disponible permite comunicar una tendencia observada sin atribuir causas.",
        indicator,
        sourceRef,
        tone: "info",
      },
    ];
  }

  if (direction === "gain") {
    return [
      {
        id: "document-gain",
        title: "Documentar la ganancia observada",
        action:
          "Registrar las prácticas y eventos del periodo con datos municipales antes de atribuir la mejora a una intervención.",
        rationale: `El NDVI pasó de ${formatNdvi(change.firstValue)} a ${formatNdvi(change.lastValue)}; la mejora es una observación, no una evaluación de impacto.`,
        indicator,
        sourceRef,
        tone: "info",
      },
    ];
  }

  return [
    {
      id: "stable-monitoring",
      title: "Mantener el monitoreo periódico",
      action: "Conservar la medición anual del NDVI y vigilar cambios en la ventana estacional.",
      rationale: "El cambio de NDVI está dentro del umbral de estabilidad definido para el análisis.",
      indicator,
      sourceRef,
      tone: "info",
    },
  ];
}

function greenAreaStrategy(district: DistrictData, districts: DistrictData[]): AwarenessStrategy | null {
  const { value, average, gap } = equipmentGap(district, districts, "green_area_m2_per_capita");
  if (value == null || average.average == null || gap == null) return null;
  if (gap.absolute >= 0) return null;

  return {
    id: "green-area-gap",
    title: "Área verde por debajo del promedio municipal",
    action:
      "Evaluar la ampliación y el mantenimiento de áreas verdes accesibles, junto con una campaña de cuidado comunitario.",
    rationale: `El distrito registra ${formatPerCapita(value)} frente a un promedio municipal de ${formatPerCapita(
      average.average,
    )} (n = ${average.n}) en ${district.equipment.territorial_reference_year ?? "el año de referencia"}.`,
    indicator: {
      label: "Área verde por habitante",
      value: formatPerCapita(value),
      year: district.equipment.territorial_reference_year,
    },
    sourceRef: primarySource(district),
    tone: "attention",
  };
}

function heatStrategy(district: DistrictData, districts: DistrictData[], year: number | null): AwarenessStrategy | null {
  const trend = trendFor(district, "lst");
  const point = seriesPointForYear(district, year);
  const average = municipalAverage(districts, "lst_mean_celsius", year);
  const value = point?.lst_mean_celsius ?? null;
  const aboveAverage = value != null && average.average != null && value - average.average > 0.5;
  const worsening = trend?.direction === "worsening";

  if (!worsening && !aboveAverage) return null;

  const reason = worsening
    ? "La tendencia declarada de LST es de deterioro."
    : `La LST media supera en más de 0,5 °C el promedio municipal (n = ${average.n}).`;

  return {
    id: "heat-awareness",
    title: "Calor superficial y arbolado urbano",
    action: "Impulsar sombra y arbolado en los puntos más cálidos, coordinando con el monitoreo de NDVI.",
    rationale: `${reason} LST es temperatura superficial, no del aire.`,
    indicator: {
      label: "LST media",
      value: value == null ? NOT_AVAILABLE : `${value.toFixed(1).replace(".", ",")} °C`,
      year: point?.year ?? null,
    },
    sourceRef: primarySource(district),
    tone: "attention",
  };
}

function buildMessages(
  district: DistrictData,
  direction: AwarenessDirection,
  change: GreenChange,
): AwarenessMessage[] {
  const messages: AwarenessMessage[] = [];

  if (change.available) {
    messages.push({
      id: "series",
      text: `En ${district.name}, el NDVI medio pasó de ${formatNdvi(change.firstValue)} a ${formatNdvi(
        change.lastValue,
      )} entre ${change.firstYear} y ${change.lastYear}. Es una ${thresholdLabel(direction)} de vigor vegetal.`,
      basis: "Serie anual de NDVI del dataset del distrito.",
    });
  } else {
    messages.push({
      id: "series-missing",
      text: `En ${district.name} todavía no hay suficientes años con dato de NDVI para describir un cambio.`,
      basis: "Serie anual de NDVI del dataset del distrito.",
    });
  }

  messages.push({
    id: "meaning",
    text: "El NDVI resume cuánta vegetación activa se observa desde satélite. Un valor más bajo indica menos vigor vegetal, no necesariamente tala.",
    basis: "Definición metodológica del índice (RNF-16).",
  });

  if (district.equipment.territorial_reference_year != null) {
    messages.push({
      id: "territorial",
      text: `Los datos de equipamiento y áreas verdes corresponden a ${district.equipment.territorial_reference_year} y no se extrapolan a otros años.`,
      basis: "Año de referencia territorial declarado en el dataset.",
    });
  }

  return messages;
}

/**
 * Evalúa un distrito con reglas explicables. No calcula hotspots ni
 * deforestación: solo describe el cambio de NDVI ya presente en la serie y
 * propone acciones de concientización prudentes.
 */
export function assessAwareness(
  district: DistrictData,
  districts: DistrictData[],
  year: number | null,
): AwarenessAssessment {
  const change = ndviChange(district);
  const direction: AwarenessDirection = change.available ? change.direction : "insufficient";

  const strategies: AwarenessStrategy[] = ndviStrategies(district, direction, change);
  const greenArea = greenAreaStrategy(district, districts);
  if (greenArea) strategies.push(greenArea);
  const heat = heatStrategy(district, districts, year);
  if (heat) strategies.push(heat);

  return {
    districtId: district.district_id,
    districtName: district.name,
    direction,
    headline: buildHeadline(district, direction, change),
    change,
    strategies: strategies.slice(0, 3),
    messages: buildMessages(district, direction, change),
    citations: buildCitations(district, change),
    caveats: buildCaveats(district),
    dataStatus: district.data_status,
    territorialReferenceYear: district.equipment.territorial_reference_year,
  };
}

export interface GreenCoverRow {
  districtId: number;
  districtName: string;
  change: GreenChange;
  direction: AwarenessDirection;
  dataStatus: DistrictData["data_status"];
}

/** Ranking de cambio de cobertura verde; los distritos sin serie van al final. */
export function rankGreenCover(districts: DistrictData[]): GreenCoverRow[] {
  return districts
    .map((district) => {
      const change = ndviChange(district);
      return {
        districtId: district.district_id,
        districtName: district.name,
        change,
        direction: (change.available ? change.direction : "insufficient") as AwarenessDirection,
        dataStatus: district.data_status,
      };
    })
    .sort((a, b) => {
      const aValue = a.change.absolute;
      const bValue = b.change.absolute;
      if (aValue == null && bValue == null) return a.districtId - b.districtId;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      return aValue - bValue;
    });
}

export function directionLabel(direction: AwarenessDirection): string {
  switch (direction) {
    case "loss":
      return "Pérdida de vigor";
    case "gain":
      return "Ganancia de vigor";
    case "stable":
      return "Sin cambio relevante";
    default:
      return "Serie insuficiente";
  }
}

export function directionIcon(direction: AwarenessDirection): string {
  switch (direction) {
    case "loss":
      return "▼";
    case "gain":
      return "▲";
    case "stable":
      return "■";
    default:
      return "?";
  }
}
