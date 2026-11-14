export const PERIOD_START = 2015;
export const PERIOD_END = 2025;
export const EXPECTED_DISTRICTS = 15;
export const CORRELATION_MIN_N = 8;

export const WEIGHTS = {
  vegetation: 0.35,
  surface_temperature: 0.35,
  urban_equipment: 0.2,
  mobility: 0.1,
} as const;

export const TREND_CONFIG = {
  ndvi: { stableThreshold: 0.001, accelerationThreshold: 0.001, positiveIsImproving: true, unit: "NDVI/año" },
  lst: { stableThreshold: 0.05, accelerationThreshold: 0.05, positiveIsImproving: false, unit: "°C/año" },
  environmental_index: { stableThreshold: 0.2, accelerationThreshold: 0.2, positiveIsImproving: true, unit: "índice/año" },
  socioenvironmental_index: { stableThreshold: 0.2, accelerationThreshold: 0.2, positiveIsImproving: true, unit: "índice/año" },
} as const;

export type TrendVariable = keyof typeof TREND_CONFIG;

export const HOTSPOT_RULES = {
  NDVI_NEGATIVE_TREND: { weight: 20, threshold: -0.002, description: "Tendencia de NDVI negativa por debajo del umbral." },
  LST_POSITIVE_TREND: { weight: 20, threshold: 0.1, description: "Tendencia de LST positiva por encima del umbral." },
  LOW_ENVIRONMENTAL_INDEX: { weight: 15, threshold: 40, description: "Índice ambiental por debajo del umbral de atención." },
  EQUIPMENT_DEFICIT: { weight: 20, threshold: 4, description: "Área verde por habitante por debajo del umbral." },
  MOBILITY_DEFICIT: { weight: 15, threshold: 0.4, description: "Cobertura de transporte por debajo del umbral." },
  LOW_NDVI: { weight: 10, threshold: 0.2, description: "NDVI del año por debajo del umbral de vegetación escasa." },
} as const;

export const PRIORITY_THRESHOLDS = { high: 60, medium: 30 } as const;
export const PRIORITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3, insufficient_data: 0 };

export const HEATMAP_RESOLUTION_M = 1000;
export const HEATMAP_LST_CLASSES = { low: 29, medium: 33 } as const;
export const HEATMAP_ICVSA_CLASSES = { low: 70, medium: 40 } as const;
export const HEATMAP_SEVERITY_CLASSES = { low: 30, medium: 60 } as const;

export const HOTSPOT_DISCLAIMER =
  "Clasificación indicativa basada en reglas explícitas. No es una evaluación oficial del GAMC ni una priorización de inversión.";
export const CORRELATION_DISCLAIMER =
  "Análisis exploratorio. No establecer causalidad ni priorizar inversión con este resultado.";
export const AI_DISCLAIMER =
  "Respuesta generada a partir de datos precalculados. No es una evaluación oficial del GAMC ni una priorización de inversión. No implica causalidad.";

export const VARIABLE_FIELDS = {
  ndvi: "ndvi_mean",
  lst: "lst_mean_celsius",
  environmental_index: "environmental_index",
  socioenvironmental_index: "socioenvironmental_index",
  equipment_access_index: "equipment_access_index",
  mobility_access_index: "mobility_access_index",
} as const;
