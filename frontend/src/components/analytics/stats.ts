import type { DistrictData, DistrictSeriesPoint, DistrictTrend } from "../../../../shared/types/geoqocha";
import type { MetricKey } from "./types";

export interface AverageResult {
  average: number | null;
  n: number;
}

export interface GapResult {
  absolute: number;
  relativePercent: number | null;
}

export function seriesPointForYear(district: DistrictData, year: number | null | undefined): DistrictSeriesPoint | null {
  if (year == null) return latestSeriesPoint(district);
  return district.series.find((point) => point.year === year) ?? null;
}

export function latestSeriesPoint(district: DistrictData): DistrictSeriesPoint | null {
  if (district.series.length === 0) return null;
  return district.series.reduce((latest, point) => (point.year > latest.year ? point : latest));
}

export function metricValue(point: DistrictSeriesPoint | null, metric: MetricKey): number | null {
  if (!point) return null;
  const value = point[metric];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function districtMetricValue(district: DistrictData, metric: MetricKey, year: number | null | undefined): number | null {
  return metricValue(seriesPointForYear(district, year), metric);
}

/** Promedio municipal que ignora `null`; nunca imputa cero (RN-07). */
export function municipalAverage(districts: DistrictData[], metric: MetricKey, year: number | null | undefined): AverageResult {
  const values = districts
    .map((district) => districtMetricValue(district, metric, year))
    .filter((value): value is number => value != null);
  if (values.length === 0) return { average: null, n: 0 };
  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    n: values.length,
  };
}

export function computeGap(value: number | null | undefined, average: number | null | undefined): GapResult | null {
  if (value == null || average == null) return null;
  const absolute = value - average;
  const relativePercent = average === 0 ? null : (absolute / Math.abs(average)) * 100;
  return { absolute, relativePercent };
}

export function gapVsMunicipal(
  district: DistrictData,
  districts: DistrictData[],
  metric: MetricKey,
  year: number | null | undefined,
): { gap: GapResult | null; average: AverageResult } {
  const average = municipalAverage(districts, metric, year);
  const value = districtMetricValue(district, metric, year);
  return { gap: computeGap(value, average.average), average };
}

export function trendFor(district: DistrictData, variable: DistrictTrend["variable"]): DistrictTrend | null {
  return district.trends.find((trend) => trend.variable === variable) ?? null;
}

export interface GreenChange {
  available: boolean;
  firstYear: number | null;
  lastYear: number | null;
  firstValue: number | null;
  lastValue: number | null;
  absolute: number | null;
  relativePercent: number | null;
  direction: "loss" | "gain" | "stable" | "insufficient";
  yearsUsed: number[];
}

/**
 * Cambio de vigor vegetal (NDVI) entre el primer y el último año con dato.
 * No representa área deforestada ni implica causalidad.
 */
export function ndviChange(district: DistrictData): GreenChange {
  const valid = district.series
    .filter((point) => point.ndvi_mean != null)
    .sort((a, b) => a.year - b.year);

  if (valid.length < 2) {
    return {
      available: false,
      firstYear: valid[0]?.year ?? null,
      lastYear: valid[0]?.year ?? null,
      firstValue: valid[0]?.ndvi_mean ?? null,
      lastValue: valid[0]?.ndvi_mean ?? null,
      absolute: null,
      relativePercent: null,
      direction: "insufficient",
      yearsUsed: valid.map((point) => point.year),
    };
  }

  const first = valid[0];
  const last = valid[valid.length - 1];
  const firstValue = first.ndvi_mean as number;
  const lastValue = last.ndvi_mean as number;
  const absolute = lastValue - firstValue;
  const relativePercent = firstValue === 0 ? null : (absolute / Math.abs(firstValue)) * 100;
  const threshold = 0.005;
  const direction = absolute > threshold ? "gain" : absolute < -threshold ? "loss" : "stable";

  return {
    available: true,
    firstYear: first.year,
    lastYear: last.year,
    firstValue,
    lastValue,
    absolute,
    relativePercent,
    direction,
    yearsUsed: valid.map((point) => point.year),
  };
}

export function availableYears(districts: DistrictData[]): number[] {
  const years = new Set<number>();
  districts.forEach((district) => district.series.forEach((point) => years.add(point.year)));
  return [...years].sort((a, b) => a - b);
}

export function latestYear(districts: DistrictData[]): number | null {
  const years = availableYears(districts);
  return years.length > 0 ? years[years.length - 1] : null;
}

export function districtById(districts: DistrictData[], id: number | null | undefined): DistrictData | null {
  if (id == null) return null;
  return districts.find((district) => district.district_id === id) ?? null;
}
