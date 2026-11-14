import type { AIEvidence, DataQualityFlag, DataStatus, Hotspot, PriorityLevel, TrendDirection } from "../types/geoqocha.js";

export interface AIFact {
  key: string;
  district_id: number | null;
  year: number | null;
  field: string;
  label: string;
  value: number | string | null;
  unit: string | null;
  source_ref: string;
  source_label: string;
  data_quality_flag?: DataQualityFlag;
}

export interface AIContextDistrict {
  district_id: number;
  name: string;
  population: number | null;
  population_year: number | null;
  area_km2: number | null;
  territorial_reference_year: number | null;
  latest_year: number | null;
  risk_level: string;
  data_status: DataStatus;
}

export interface AIContextTrend {
  variable: string;
  direction: TrendDirection;
  slope_per_year: number | null;
  unit: string;
  years_used: number[];
  is_significant: boolean | null;
  accelerated: boolean;
}

export interface AIContext {
  request: {
    mode: "chat" | "diagnosis";
    district_id: number | null;
    year: number | null;
    question: string | null;
  };
  district: AIContextDistrict | null;
  facts: AIFact[];
  trends: AIContextTrend[];
  hotspot: Hotspot | null;
  municipal_average: Record<string, number | null>;
  data_status: DataStatus;
  generated_at: string;
  sources: Array<{ id: string; label: string }>;
  context_text: string;
  allowed_numbers: string[];
}

export interface AIDraftInsight {
  kind: "observation" | "risk" | "recommendation" | "caveat";
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  evidence: Array<Pick<AIFact, "field" | "year" | "source_ref">>;
}

export interface AIDraft {
  answer: string;
  insights: AIDraftInsight[];
  citations: Array<{ source_ref: string; field?: string; year?: number }>;
}

export interface AIProviderResult {
  draft: AIDraft;
  provider: string;
  model: string;
}

export interface AIServiceResult {
  answer: string;
  insights: AIDraftInsight[];
  citations: AIEvidenceCitation[];
  fallbackUsed: boolean;
  provider: string | null;
  model: string | null;
  context: AIContext;
}

export interface AIEvidenceCitation {
  source_ref: string;
  label: string;
  field?: string;
  year?: number;
}
