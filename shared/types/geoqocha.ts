export const CONTRACT_VERSION = "0.1.0" as const;

export type DataStatus = "real" | "illustrative" | "insufficient";
export type DataQualityFlag = "ok" | "partial" | "insufficient";
export type TrendDirection = "improving" | "stable" | "worsening" | "undetermined";
export type RiskLevel = "low" | "medium" | "high" | "insufficient_data";
export type Variable =
  | "icvsa"
  | "environmental_index"
  | "ndvi"
  | "lst"
  | "priority"
  | "equipment"
  | "mobility";

export interface DistrictSeriesPoint {
  year: number;
  ndvi_mean: number | null;
  lst_mean_celsius: number | null;
  environmental_index: number | null;
  socioenvironmental_index: number | null;
  index_without_territorial: number | null;
  data_quality_flag: DataQualityFlag;
}

export interface DistrictTrend {
  variable: "ndvi" | "lst" | "environmental_index" | "socioenvironmental_index";
  direction: TrendDirection;
  slope_per_year: number | null;
  unit: string;
  years_used: number[];
  method: string;
  is_significant: boolean | null;
  acceleration: number | null;
  accelerated: boolean;
  notes: string[];
}

export interface EquipmentMetrics {
  district_id: number;
  territorial_reference_year: number | null;
  population: number | null;
  green_area_m2_per_capita: number | null;
  schools_per_1000: number | null;
  health_centers_per_1000: number | null;
  transport_coverage_fraction: number | null;
  equipment_access_index: number | null;
  mobility_access_index: number | null;
  deficit_flags: string[];
}

export interface StopPoint {
  stop_id: string;
  name: string;
  district_id: number;
  latitude: number;
  longitude: number;
  routes: string[];
  boarding_recommended: boolean;
  safety_score: number | null;
  notes: string | null;
  data_status: DataStatus;
}

export interface DistrictGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

export interface DistrictData {
  district_id: number;
  name: string;
  geometry: DistrictGeometry | null;
  area_km2: number | null;
  population: number | null;
  population_year: number | null;
  territorial_reference_year: number | null;
  latest_year: number | null;
  latest_socioenvironmental_index: number | null;
  risk_level: RiskLevel;
  series: DistrictSeriesPoint[];
  trends: DistrictTrend[];
  equipment: EquipmentMetrics;
  transport_stops: StopPoint[];
  data_status: DataStatus;
  source_refs: string[];
}

export interface AIRequest {
  mode: "chat" | "diagnosis";
  district_id?: number;
  year?: number;
  question?: string;
  locale?: "es";
}

export interface AIEvidence {
  field: string;
  year: number | null;
  value: number | string | null;
  unit: string | null;
  source_ref: string;
}

export interface AIInsight {
  id: string;
  kind: "observation" | "risk" | "recommendation" | "caveat";
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  evidence: AIEvidence[];
}

export interface AICitation {
  source_ref: string;
  label: string;
  field?: string;
  year?: number;
}

export interface AIResponse {
  request_id: string;
  mode: "chat" | "diagnosis";
  district_id: number | null;
  year: number | null;
  answer: string;
  insights: AIInsight[];
  citations: AICitation[];
  disclaimer: string;
  data_status: DataStatus;
  model: { provider: string; name: string; prompt_version: string } | null;
  generated_at: string;
  fallback_used: boolean;
}
