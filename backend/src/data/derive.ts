import {
  CORRELATION_DISCLAIMER,
  CORRELATION_MIN_N,
  HEATMAP_ICVSA_CLASSES,
  HEATMAP_LST_CLASSES,
  HEATMAP_RESOLUTION_M,
  HEATMAP_SEVERITY_CLASSES,
  HOTSPOT_RULES,
  PRIORITY_THRESHOLDS,
  TREND_CONFIG,
  VARIABLE_FIELDS,
} from "./constants.js";
import type { DatasetStore } from "./store.js";
import { mean, pearson, round, spearman } from "./stats.js";
import type {
  CorrelationResult,
  DistrictData,
  DistrictGeometry,
  DistrictSeriesPoint,
  DistrictTrend,
  Hotspot,
  HotspotRule,
  PriorityLevel,
  TrendDirection,
} from "../types/geoqocha.js";
import { METHODOLOGY_VERSION } from "../types/geoqocha.js";

export function getPoint(district: DistrictData, year: number | null): DistrictSeriesPoint | null {
  if (year !== null) return district.series.find((point) => point.year === year) ?? null;
  if (district.latest_year !== null) return district.series.find((point) => point.year === district.latest_year) ?? null;
  return district.series.at(-1) ?? null;
}

export function getTrend(district: DistrictData, variable: DistrictTrend["variable"]): DistrictTrend | undefined {
  return district.trends.find((trend) => trend.variable === variable);
}

export function lastYearWithData(district: DistrictData): number | null {
  const years = district.series
    .filter((point) => point.ndvi_mean !== null || point.lst_mean_celsius !== null || point.environmental_index !== null)
    .map((point) => point.year);
  return years.length > 0 ? Math.max(...years) : district.latest_year;
}

export function districtSummary(district: DistrictData): Record<string, unknown> {
  return {
    district_id: district.district_id,
    name: district.name,
    area_km2: district.area_km2,
    population: district.population,
    population_year: district.population_year,
    last_data_year: lastYearWithData(district),
    territorial_reference_year: district.territorial_reference_year,
    latest_socioenvironmental_index: district.latest_socioenvironmental_index,
  };
}

export function summaryText(district: DistrictData): string {
  const point = getPoint(district, district.latest_year);
  if (!point) return `${district.name} no tiene datos ambientales disponibles.`;
  const parts = [`${district.name} presenta una condición ${conditionLabel(point.socioenvironmental_index)}.`];
  if (point.ndvi_mean !== null) parts.push(`Su NDVI es ${point.ndvi_mean.toFixed(3)}.`);
  if (point.lst_mean_celsius !== null) parts.push(`La temperatura superficial es ${point.lst_mean_celsius.toFixed(1)} °C.`);
  if (point.socioenvironmental_index !== null) parts.push(`El ICVSA es ${point.socioenvironmental_index.toFixed(1)} sobre 100.`);
  parts.push(
    `El componente territorial usa datos de ${district.territorial_reference_year ?? "un año no declarado"} y no se interpola.`,
  );
  parts.push("La lectura es descriptiva y no implica causalidad.");
  return parts.join(" ");
}

function conditionLabel(index: number | null): string {
  if (index === null) return "sin datos suficientes";
  if (index >= 70) return "relativamente favorable";
  if (index >= 40) return "intermedia";
  return "de atención";
}

export type NumericSeriesField =
  | "ndvi_mean"
  | "lst_mean_celsius"
  | "environmental_index"
  | "socioenvironmental_index";

export function municipalAverage(store: DatasetStore, year: number, field: NumericSeriesField): number | null {
  const values = store.getDataset().districts.map((district) => getPoint(district, year)?.[field] ?? null);
  return mean(values);
}

export const INDICATOR_VARIABLES = [
  "ndvi",
  "lst",
  "environmental_index",
  "socioenvironmental_index",
] as const;

export type IndicatorVariable = (typeof INDICATOR_VARIABLES)[number];

const INDICATOR_FIELDS: Record<IndicatorVariable, string[]> = {
  ndvi: ["ndvi_mean", "ndvi_valid_observation_count", "ndvi_valid_pixel_fraction"],
  lst: ["lst_mean_celsius", "lst_valid_pixel_fraction"],
  environmental_index: ["environmental_index"],
  socioenvironmental_index: ["socioenvironmental_index"],
};

export function buildIndicators(
  store: DatasetStore,
  district: DistrictData,
  from: number,
  to: number,
  variables: IndicatorVariable[],
) {
  const records = store.getDistrictYearRecords();
  const selected = variables.length > 0 ? variables : [...INDICATOR_VARIABLES];
  const series: Array<Record<string, unknown>> = [];

  for (let year = from; year <= to; year += 1) {
    const stored = records.get(`${district.district_id}-${year}`);
    const point = district.series.find((item) => item.year === year) ?? null;
    const base: Record<string, unknown> = {
      district_id: district.district_id,
      year,
      ndvi_mean: stored?.ndvi_mean ?? point?.ndvi_mean ?? null,
      ndvi_valid_observation_count: stored?.ndvi_valid_observation_count ?? null,
      ndvi_valid_pixel_fraction: stored?.ndvi_valid_pixel_fraction ?? null,
      lst_mean_celsius: stored?.lst_mean_celsius ?? point?.lst_mean_celsius ?? null,
      lst_valid_pixel_fraction: stored?.lst_valid_pixel_fraction ?? null,
      environmental_index: stored?.environmental_index ?? point?.environmental_index ?? null,
      socioenvironmental_index: stored?.socioenvironmental_index ?? point?.socioenvironmental_index ?? null,
      index_without_territorial: stored?.index_without_territorial ?? point?.index_without_territorial ?? null,
      territorial_reference_year: stored?.territorial_reference_year ?? district.territorial_reference_year,
      equipment_access_index: stored?.equipment_access_index ?? district.equipment.equipment_access_index,
      mobility_access_index: stored?.mobility_access_index ?? district.equipment.mobility_access_index,
      data_quality_flag: stored?.data_quality_flag ?? point?.data_quality_flag ?? "insufficient",
      source_refs: stored?.source_refs ?? district.source_refs,
    };

    const filtered: Record<string, unknown> = {
      district_id: base.district_id,
      year: base.year,
      territorial_reference_year: base.territorial_reference_year,
      equipment_access_index: base.equipment_access_index,
      mobility_access_index: base.mobility_access_index,
      data_quality_flag: base.data_quality_flag,
      source_refs: base.source_refs,
    };
    for (const variable of selected) {
      for (const field of INDICATOR_FIELDS[variable]) filtered[field] = base[field];
    }
    series.push(filtered);
  }

  return {
    district_id: district.district_id,
    district_name: district.name,
    from,
    to,
    series,
    metadata: {
      generated_at: store.getDataset().generated_at,
      methodology_version: METHODOLOGY_VERSION,
      notes: [
        "LST es temperatura superficial, no temperatura del aire.",
        "Los años sin observación llevan null y data_quality_flag insufficient.",
        "Equipamiento y movilidad usan el año de referencia territorial sin interpolación.",
      ],
    },
  };
}

const COMPARISON_FIELDS: Record<string, keyof DistrictSeriesPoint | "equipment_access_index" | "mobility_access_index"> = {
  ndvi: "ndvi_mean",
  lst: "lst_mean_celsius",
  environmental_index: "environmental_index",
  socioenvironmental_index: "socioenvironmental_index",
  equipment_access_index: "equipment_access_index",
  mobility_access_index: "mobility_access_index",
};

function comparisonValue(district: DistrictData, point: DistrictSeriesPoint | null, variable: string): number | null {
  if (!point) return null;
  if (variable === "equipment_access_index") return district.equipment.equipment_access_index;
  if (variable === "mobility_access_index") return district.equipment.mobility_access_index;
  const field = COMPARISON_FIELDS[variable];
  if (!field) return null;
  return (point[field as keyof DistrictSeriesPoint] as number | null) ?? null;
}

export function buildComparison(store: DatasetStore, districtIds: number[], year: number, variables: string[]) {
  const districts = districtIds.map((districtId) => store.requireDistrict(districtId));
  const averages = Object.fromEntries(
    variables.map((variable) => [
      variable,
      mean(
        store.getDataset().districts.map((district) =>
          comparisonValue(district, getPoint(district, year), variable),
        ),
      ),
    ]),
  ) as Record<string, number | null>;

  const payloadDistricts = districts.map((district) => {
    const point = getPoint(district, year);
    const values = Object.fromEntries(variables.map((variable) => [variable, comparisonValue(district, point, variable)]));
    return {
      district_id: district.district_id,
      district_name: district.name,
      values,
      data_quality_flag: point?.data_quality_flag ?? "insufficient",
    };
  });

  const gaps = districts.flatMap((district) => {
    const point = getPoint(district, year);
    return variables.flatMap((variable) => {
      const value = comparisonValue(district, point, variable);
      const average = averages[variable];
      if (value === null || average === null || average === 0) {
        return [{ district_id: district.district_id, variable, absolute: null, relative_percent: null }];
      }
      const absolute = value - average;
      return [
        {
          district_id: district.district_id,
          variable,
          absolute: round(absolute, 3),
          relative_percent: round((absolute / average) * 100, 1),
        },
      ];
    });
  });

  const [reference, ...rest] = districts;
  const referencePoint = reference ? getPoint(reference, year) : null;
  const differences = rest.flatMap((district) =>
    variables.flatMap((variable) => {
      const from = comparisonValue(reference, referencePoint, variable);
      const to = comparisonValue(district, getPoint(district, year), variable);
      if (from === null || to === null) {
        return [
          {
            variable,
            from_district: reference?.district_id ?? null,
            to_district: district.district_id,
            absolute: null,
            relative_percent: null,
          },
        ];
      }
      const absolute = to - from;
      return [
        {
          variable,
          from_district: reference?.district_id ?? null,
          to_district: district.district_id,
          absolute: round(absolute, 3),
          relative_percent: round(from === 0 ? null : (absolute / from) * 100, 1),
        },
      ];
    }),
  );

  const warnings = payloadDistricts
    .filter((district) => district.data_quality_flag !== "ok")
    .map((district) => `${district.district_name} tiene calidad de dato ${district.data_quality_flag} en ${year}.`);

  return {
    year,
    districts: payloadDistricts,
    gaps_vs_municipal_average: gaps,
    differences,
    warnings,
  };
}

function classifyLst(value: number | null): string {
  if (value === null) return "insufficient";
  if (value < HEATMAP_LST_CLASSES.low) return "low";
  if (value < HEATMAP_LST_CLASSES.medium) return "medium";
  return "high";
}

function classifyIcvsa(value: number | null): string {
  if (value === null) return "insufficient";
  if (value >= HEATMAP_ICVSA_CLASSES.low) return "low";
  if (value >= HEATMAP_ICVSA_CLASSES.medium) return "medium";
  return "high";
}

function classifySeverity(value: number | null): string {
  if (value === null) return "insufficient";
  if (value < HEATMAP_SEVERITY_CLASSES.low) return "low";
  if (value < HEATMAP_SEVERITY_CLASSES.medium) return "medium";
  return "high";
}

function geometryCentroid(geometry: DistrictGeometry | null): { latitude: number | null; longitude: number | null } {
  if (!geometry || geometry.type !== "Polygon" || !geometry.coordinates[0]) {
    return { latitude: null, longitude: null };
  }
  const ring = geometry.coordinates[0];
  if (ring.length === 0) return { latitude: null, longitude: null };
  const longitude = ring.reduce((total, point) => total + point[0], 0) / ring.length;
  const latitude = ring.reduce((total, point) => total + point[1], 0) / ring.length;
  return { latitude: round(latitude, 6), longitude: round(longitude, 6) };
}

export function buildHeatmap(store: DatasetStore, variable: "lst" | "icvsa" | "severity", year: number) {
  const cells = store.getDataset().districts.map((district) => {
    const point = getPoint(district, year);
    const centroid = geometryCentroid(district.geometry);
    let value: number | null;
    let cellClass: string;
    if (variable === "icvsa") {
      value = point?.socioenvironmental_index ?? null;
      cellClass = classifyIcvsa(value);
    } else if (variable === "severity") {
      value = buildHotspot(district, year).score;
      cellClass = classifySeverity(value);
    } else {
      value = point?.lst_mean_celsius ?? null;
      cellClass = classifyLst(value);
    }
    return {
      district_id: district.district_id,
      latitude: centroid.latitude,
      longitude: centroid.longitude,
      value: round(value, 2),
      class: cellClass,
    };
  });

  const units = { lst: "°C", icvsa: "índice", severity: "puntaje" };
  const methods = {
    lst: "Media zonal MOD11A2 por distrito; celdas agregadas para visualización.",
    icvsa: "ICVSA precalculado por distrito; celdas agregadas para visualización.",
    severity: "Puntaje de reglas de hotspot por distrito; celdas agregadas para visualización.",
  };

  return {
    variable,
    year,
    unit: units[variable],
    resolution_m: HEATMAP_RESOLUTION_M,
    method: methods[variable],
    cells,
  };
}

function rule(
  ruleId: keyof typeof HOTSPOT_RULES,
  variable: HotspotRule["variable"],
  observed: number | null,
  triggered: boolean,
): HotspotRule {
  return {
    rule_id: ruleId,
    variable,
    description: HOTSPOT_RULES[ruleId].description,
    observed_value: round(observed, 4),
    threshold: HOTSPOT_RULES[ruleId].threshold,
    triggered,
  };
}

export function buildHotspot(district: DistrictData, year: number): Hotspot {
  const point = getPoint(district, year);
  const ndviSlope = getTrend(district, "ndvi")?.slope_per_year ?? null;
  const lstSlope = getTrend(district, "lst")?.slope_per_year ?? null;
  const environmentalIndex = point?.environmental_index ?? null;
  const ndvi = point?.ndvi_mean ?? null;
  const greenArea = district.equipment.green_area_m2_per_capita;
  const coverage = district.equipment.transport_coverage_fraction;

  const rules: HotspotRule[] = [
    rule("NDVI_NEGATIVE_TREND", "ndvi", ndviSlope, ndviSlope !== null && ndviSlope < HOTSPOT_RULES.NDVI_NEGATIVE_TREND.threshold),
    rule("LST_POSITIVE_TREND", "lst", lstSlope, lstSlope !== null && lstSlope > HOTSPOT_RULES.LST_POSITIVE_TREND.threshold),
    rule(
      "LOW_ENVIRONMENTAL_INDEX",
      "environmental_index",
      environmentalIndex,
      environmentalIndex !== null && environmentalIndex < HOTSPOT_RULES.LOW_ENVIRONMENTAL_INDEX.threshold,
    ),
    rule("EQUIPMENT_DEFICIT", "equipment", greenArea, greenArea !== null && greenArea < HOTSPOT_RULES.EQUIPMENT_DEFICIT.threshold),
    rule("MOBILITY_DEFICIT", "coverage", coverage, coverage !== null && coverage < HOTSPOT_RULES.MOBILITY_DEFICIT.threshold),
    rule("LOW_NDVI", "ndvi", ndvi, ndvi !== null && ndvi < HOTSPOT_RULES.LOW_NDVI.threshold),
  ];

  const evaluable = rules.filter((item) => item.observed_value !== null);
  if (evaluable.length === 0) {
    return {
      district_id: district.district_id,
      district_name: district.name,
      year,
      priority_level: "insufficient_data",
      score: null,
      rules,
      explanation: "Sin datos suficientes para evaluar reglas en este año.",
    };
  }

  const triggered = rules.filter((item) => item.triggered);
  const score = triggered.reduce((total, item) => total + HOTSPOT_RULES[item.rule_id as keyof typeof HOTSPOT_RULES].weight, 0);
  const priority: PriorityLevel =
    score >= PRIORITY_THRESHOLDS.high ? "high" : score >= PRIORITY_THRESHOLDS.medium ? "medium" : "low";
  const explanation =
    triggered.length > 0
      ? `Reglas activadas: ${triggered.map((item) => item.description.replace(/\.$/, "")).join("; ")}. Requiere estudio adicional.`
      : "No se activaron reglas de hotspot con los umbrales publicados.";

  return {
    district_id: district.district_id,
    district_name: district.name,
    year,
    priority_level: priority,
    score,
    rules,
    explanation,
  };
}

export function buildHotspots(store: DatasetStore, year: number, minPriority: PriorityLevel | "medium" = "medium"): Hotspot[] {
  const rank: Record<string, number> = { low: 1, medium: 2, high: 3, insufficient_data: 0 };
  const minimum = rank[minPriority] ?? 2;
  return store
    .getDataset()
    .districts.map((district) => buildHotspot(district, year))
    .filter((hotspot) => (rank[hotspot.priority_level] ?? 0) >= minimum)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.district_id - b.district_id);
}

const X_VARIABLES = {
  ndvi_trend: "ndvi",
  lst_trend: "lst",
  environmental_index_trend: "environmental_index",
} as const;

export function buildCorrelation(
  store: DatasetStore,
  xVariable: keyof typeof X_VARIABLES,
  yVariable: "equipment_access_index" | "mobility_access_index",
  method: "pearson" | "spearman",
): CorrelationResult {
  const districts = store.getDataset().districts.flatMap((district) => {
    const trend = getTrend(district, X_VARIABLES[xVariable]);
    const x = trend?.slope_per_year ?? null;
    const y = district.equipment[yVariable];
    if (x === null || y === null) return [];
    return [{ district_id: district.district_id, district_name: district.name, x, y }];
  });

  const xs = districts.map((item) => item.x);
  const ys = districts.map((item) => item.y);
  const stats = method === "spearman" ? spearman(xs, ys) : pearson(xs, ys);
  const n = stats.n;
  const coefficient = n >= CORRELATION_MIN_N ? stats.coefficient : null;
  const pValue = n >= CORRELATION_MIN_N ? stats.pValue : null;

  let interpretation: string;
  if (n < CORRELATION_MIN_N) {
    interpretation = `Insuficientes distritos con datos completos (n=${n}); no se calcula un coeficiente concluyente ni se establece causalidad.`;
  } else if (coefficient === null) {
    interpretation = `Hay ${n} distritos con datos, pero una de las variables no tiene variación suficiente; no se calcula un coeficiente y no se establece causalidad.`;
  } else {
    const magnitude = Math.abs(coefficient);
    const strength = magnitude >= 0.7 ? "fuerte" : magnitude >= 0.4 ? "moderada" : magnitude >= 0.2 ? "débil" : "muy débil";
    const sign = coefficient > 0 ? "positiva" : "negativa";
    const target = yVariable === "equipment_access_index" ? "equipamiento" : "movilidad";
    interpretation = `Relación ${sign} ${strength} entre la tendencia ambiental y el acceso a ${target} con n=${n}; es exploratoria y no implica causalidad.`;
  }

  return {
    x_variable: xVariable,
    y_variable: yVariable,
    coefficient: round(coefficient, 3),
    method,
    n,
    p_value: round(pValue, 4),
    interpretation,
    districts,
    disclaimer: CORRELATION_DISCLAIMER,
  };
}

export function availability(district: DistrictData): {
  hasEnvironmental: boolean;
  hasTerritorial: boolean;
  hasAnyData: boolean;
} {
  const point = getPoint(district, district.latest_year);
  return {
    hasEnvironmental: Boolean(point && point.ndvi_mean !== null && point.lst_mean_celsius !== null),
    hasTerritorial:
      district.equipment.equipment_access_index !== null && district.equipment.mobility_access_index !== null,
    hasAnyData: Boolean(district.series.some((item) => item.ndvi_mean !== null || item.lst_mean_celsius !== null)),
  };
}

export function trendDirectionFor(variable: DistrictTrend["variable"], slope: number | null): TrendDirection {
  if (slope === null) return "undetermined";
  const config = TREND_CONFIG[variable];
  if (Math.abs(slope) < config.stableThreshold) return "stable";
  const improving = config.positiveIsImproving ? slope > 0 : slope < 0;
  return improving ? "improving" : "worsening";
}

export function methodologyVersion(): string {
  return METHODOLOGY_VERSION;
}

export function fieldLabel(variable: string): string {
  return VARIABLE_FIELDS[variable as keyof typeof VARIABLE_FIELDS] ?? variable;
}
