import type { DistrictData, DistrictSeriesPoint, RiskLevel, Variable } from "../../../../shared/types/geoqocha";
import type { IndexView } from "./map.types";

export const VARIABLE_OPTIONS: Array<{ value: Variable; label: string }> = [
  { value: "icvsa", label: "ICVSA" },
  { value: "ndvi", label: "NDVI" },
  { value: "lst", label: "LST" },
  { value: "priority", label: "Prioridad" },
];

export const YEAR_OPTIONS = Array.from({ length: 11 }, (_, index) => 2015 + index);

export function getSeriesPoint(district: DistrictData, year: number): DistrictSeriesPoint | null {
  return district.series.find((point) => point.year === year) ?? null;
}

export function getValue(district: DistrictData, year: number, variable: Variable): number | null {
  const point = getSeriesPoint(district, year);
  if (variable === "priority") return riskValue(district.risk_level);
  if (!point) return null;

  switch (variable) {
    case "icvsa":
      return point.socioenvironmental_index;
    case "environmental_index":
      return point.environmental_index;
    case "ndvi":
      return point.ndvi_mean;
    case "lst":
      return point.lst_mean_celsius;
    default:
      return null;
  }
}

function riskValue(risk: RiskLevel): number | null {
  if (risk === "high") return 90;
  if (risk === "medium") return 55;
  if (risk === "low") return 20;
  return null;
}

export function semaphoreFor(value: number | null): {
  label: string;
  icon: string;
  color: string;
  surface: string;
} {
  if (value === null) return { label: "Sin dato", icon: "—", color: "#64746d", surface: "#eef3ed" };
  if (value >= 70) return { label: "Condición favorable", icon: "✓", color: "#2f855a", surface: "#e3f2e6" };
  if (value >= 40) return { label: "Condición intermedia", icon: "!", color: "#a66c19", surface: "#fff1d7" };
  return { label: "Condición de atención", icon: "!", color: "#b6403c", surface: "#fbe4e1" };
}

export function districtColor(
  district: DistrictData,
  year: number,
  variable: Variable,
  indexView: IndexView,
): string {
  const value = getValue(district, year, variable);
  if (value === null) return "#b8c5be";

  if (variable === "icvsa" && indexView === "semaphore") {
    return semaphoreFor(value).color;
  }

  if (variable === "ndvi") return interpolate(value, 0.15, 0.65, "#d95f59", "#4f9a68");
  if (variable === "lst") return interpolate(value, 24, 36, "#2b83ba", "#d7191c");
  if (variable === "priority") return semaphoreFor(100 - value).color;
  return interpolate(value, 1, 100, "#d95f59", "#4f9a68");
}

export function formatValue(value: number | null, variable: Variable): string {
  if (value === null) return "No disponible";
  if (variable === "ndvi") return value.toFixed(3);
  if (variable === "lst") return `${value.toFixed(1)} °C`;
  if (variable === "priority") return value >= 70 ? "Alta" : value >= 40 ? "Media" : "Baja";
  return `${Math.round(value)} / 100`;
}

function interpolate(value: number, min: number, max: number, start: string, end: string): string {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const from = hexToRgb(start);
  const to = hexToRgb(end);
  const channel = (a: number, b: number) => Math.round(a + (b - a) * ratio);
  return `rgb(${channel(from[0], to[0])}, ${channel(from[1], to[1])}, ${channel(from[2], to[2])})`;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}
