import type { DataQualityFlag, DistrictData } from "../../../../shared/types/geoqocha";
import { seriesPointForYear, availableYears } from "./stats";

/**
 * Copia local del documento de metodología (docs/04 §4.6). La vista acepta
 * una respuesta del backend cuando exista; mientras tanto publica el mismo
 * contenido para no dejar la sección vacía.
 */

export interface MethodologyWeight {
  key: "vegetation" | "surface_temperature" | "urban_equipment" | "mobility";
  label: string;
  weight: number;
}

export interface MethodologyClassification {
  range: [number, number];
  label: string;
  tone: "favorable" | "intermedia" | "atencion";
}

export interface MethodologyDocument {
  version: string;
  index: {
    name: string;
    scale: [number, number];
    views: string[];
    formula: string;
    weights: MethodologyWeight[];
    temporal_policy: {
      environmental: string;
      territorial: string;
      territorial_reference_year: number | null;
      interpolation_allowed: boolean;
    };
    sensitivity: { field: string; description: string };
    normalization: string;
    missing_data_policy: string;
    classification: MethodologyClassification[];
  };
  disclaimer: string;
}

export const DEFAULT_METHODOLOGY: MethodologyDocument = {
  version: "0.1.0",
  index: {
    name: "Índice de Calidad de Vida Socio-Ambiental (ICVSA)",
    scale: [1, 100],
    views: ["numeric", "semaphore"],
    formula:
      "ICVSA(d,t) = 0,35·S_ndvi(d,t) + 0,35·S_lst(d,t) + 0,20·S_equipment(d,t_ref) + 0,10·S_mobility(d,t_ref)",
    weights: [
      { key: "vegetation", label: "Vegetación (NDVI)", weight: 0.35 },
      { key: "surface_temperature", label: "Temperatura superficial (LST)", weight: 0.35 },
      { key: "urban_equipment", label: "Equipamiento urbano", weight: 0.2 },
      { key: "mobility", label: "Movilidad", weight: 0.1 },
    ],
    temporal_policy: {
      environmental: "annual",
      territorial: "fixed_at_reference_year",
      territorial_reference_year: null,
      interpolation_allowed: false,
    },
    sensitivity: {
      field: "index_without_territorial",
      description:
        "ICVSA calculado solo con NDVI y LST. Se publica cuando falta una dimensión territorial completa.",
    },
    normalization: "Min-max fijo sobre el periodo de comparación, con referencia documentada.",
    missing_data_policy: "Excluir del cálculo e informar cobertura; nunca imputar cero.",
    classification: [
      { range: [70, 100], label: "Condición relativa favorable", tone: "favorable" },
      { range: [40, 69], label: "Condición intermedia", tone: "intermedia" },
      { range: [1, 39], label: "Condición de atención", tone: "atencion" },
    ],
  },
  disclaimer:
    "Indicador sintético de apoyo al análisis; no mide bienestar de forma definitiva.",
};

export function weightsSum(weights: MethodologyWeight[]): number {
  return Number(weights.reduce((sum, item) => sum + item.weight, 0).toFixed(4));
}

export function temporalPolicyLabel(policy: MethodologyDocument["index"]["temporal_policy"]): string {
  return policy.territorial === "fixed_at_reference_year"
    ? "Territorio fijo en el año de referencia"
    : policy.territorial;
}

/** Años de referencia declarados por los distritos, sin imputar valores. */
export function referenceYears(districts: DistrictData[]): number[] {
  const years = new Set<number>();
  for (const district of districts) {
    if (district.equipment.territorial_reference_year != null) {
      years.add(district.equipment.territorial_reference_year);
    }
  }
  return [...years].sort((a, b) => a - b);
}

export interface QualityRow {
  districtId: number;
  districtName: string;
  flag: DataQualityFlag | null;
  hasNdvi: boolean;
  hasLst: boolean;
  hasIndex: boolean;
  dataStatus: DistrictData["data_status"];
}

export interface QualitySummary {
  year: number | null;
  evaluated: number;
  withoutPoint: number;
  ok: number;
  partial: number;
  insufficient: number;
  missingNdvi: number;
  missingLst: number;
  missingIndex: number;
  firstYear: number | null;
  lastYear: number | null;
  rows: QualityRow[];
}

/**
 * Cobertura y calidad del dato para el año consultado. Cuenta vacíos como
 * «no disponible», nunca como cero (RN-06).
 */
export function summarizeQuality(districts: DistrictData[], year: number | null): QualitySummary {
  const years = availableYears(districts);
  const rows: QualityRow[] = districts.map((district) => {
    const point = seriesPointForYear(district, year);
    return {
      districtId: district.district_id,
      districtName: district.name,
      flag: point?.data_quality_flag ?? null,
      hasNdvi: point?.ndvi_mean != null,
      hasLst: point?.lst_mean_celsius != null,
      hasIndex: point?.socioenvironmental_index != null,
      dataStatus: district.data_status,
    };
  });

  return {
    year,
    evaluated: rows.length,
    withoutPoint: rows.filter((row) => row.flag == null).length,
    ok: rows.filter((row) => row.flag === "ok").length,
    partial: rows.filter((row) => row.flag === "partial").length,
    insufficient: rows.filter((row) => row.flag === "insufficient").length,
    missingNdvi: rows.filter((row) => !row.hasNdvi).length,
    missingLst: rows.filter((row) => !row.hasLst).length,
    missingIndex: rows.filter((row) => !row.hasIndex).length,
    firstYear: years[0] ?? null,
    lastYear: years[years.length - 1] ?? null,
    rows,
  };
}
