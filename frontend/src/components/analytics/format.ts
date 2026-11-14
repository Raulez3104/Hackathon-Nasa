import type { DataQualityFlag, RiskLevel } from "../../../../shared/types/geoqocha";

export const NOT_AVAILABLE = "No disponible";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

interface NumberFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

function toLocale(value: number, options: NumberFormatOptions): string {
  return new Intl.NumberFormat("es-BO", options).format(value);
}

export function formatNumber(value: number | null | undefined, options: NumberFormatOptions = {}): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return toLocale(value, {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  });
}

export function formatInteger(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return toLocale(value, { maximumFractionDigits: 0 });
}

export function formatPopulation(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return `${toLocale(value, { maximumFractionDigits: 0 })} hab.`;
}

export function formatArea(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return `${toLocale(value, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km²`;
}

export function formatNdvi(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return toLocale(value, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export function formatLst(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return `${toLocale(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;
}

export function formatIndex(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return toLocale(value, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

export function formatFractionPercent(value: number | null | undefined, digits = 0): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return `${toLocale(value * 100, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} %`;
}

export function formatPerCapita(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return `${toLocale(value, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m²/hab.`;
}

export function formatRate(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  return `${toLocale(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 1.000 hab.`;
}

export function formatSigned(value: number | null | undefined, formatter: (input: number | null | undefined) => string): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatter(value)}`;
}

export function formatSignedPercent(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return NOT_AVAILABLE;
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${toLocale(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" }).format(date);
}

export function qualityLabel(flag: DataQualityFlag | null | undefined): string {
  switch (flag) {
    case "ok":
      return "Calidad completa";
    case "partial":
      return "Calidad parcial";
    case "insufficient":
      return "Datos insuficientes";
    default:
      return "Calidad sin evaluar";
  }
}

export interface SemaphoreDescriptor {
  key: "favorable" | "intermedia" | "atencion" | "insuficiente";
  label: string;
  icon: string;
  description: string;
}

/**
 * Semáforo del ICVSA (RN-01). Siempre devuelve texto e ícono:
 * el color nunca es el único portador del significado.
 */
export function semaphoreForScore(score: number | null | undefined): SemaphoreDescriptor {
  if (!isFiniteNumber(score)) {
    return {
      key: "insuficiente",
      label: "Sin dato suficiente",
      icon: "?",
      description: "No hay un ICVSA calculable para el año consultado.",
    };
  }
  if (score >= 70) {
    return {
      key: "favorable",
      label: "Condición relativa favorable",
      icon: "▲",
      description: "El índice se encuentra en el rango alto de la escala 1–100.",
    };
  }
  if (score >= 40) {
    return {
      key: "intermedia",
      label: "Condición intermedia",
      icon: "■",
      description: "El índice se encuentra en el rango medio de la escala 1–100.",
    };
  }
  return {
    key: "atencion",
    label: "Condición de atención",
    icon: "▼",
    description: "El índice se encuentra en el rango bajo de la escala 1–100.",
  };
}

export function riskLabel(risk: RiskLevel | null | undefined): SemaphoreDescriptor {
  switch (risk) {
    case "low":
      return { key: "favorable", label: "Riesgo bajo", icon: "▲", description: "Clasificación indicativa del distrito." };
    case "high":
      return { key: "atencion", label: "Riesgo alto", icon: "▼", description: "Clasificación indicativa del distrito." };
    case "medium":
      return { key: "intermedia", label: "Riesgo medio", icon: "■", description: "Clasificación indicativa del distrito." };
    default:
      return {
        key: "insuficiente",
        label: "Riesgo sin determinar",
        icon: "?",
        description: "No hay datos suficientes para clasificar el riesgo.",
      };
  }
}

export function trendDirectionLabel(direction: string | null | undefined): string {
  switch (direction) {
    case "improving":
      return "Mejora";
    case "worsening":
      return "Deterioro";
    case "stable":
      return "Estable";
    default:
      return "Sin determinar";
  }
}
