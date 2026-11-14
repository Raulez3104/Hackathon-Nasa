import type { DataStatus, DistrictData } from "../../../../shared/types/geoqocha";

/** Envoltura del dataset publicado en `frontend/public/data/`. */
export interface DistrictDataset {
  contract_version: string;
  data_status: DataStatus;
  generated_at: string;
  districts: DistrictData[];
}

export type DatasetStatus = "idle" | "loading" | "ready" | "error";

export interface DatasetState {
  status: DatasetStatus;
  dataset: DistrictDataset | null;
  error: string | null;
  usingFallback: boolean;
}

export type MetricKey =
  | "socioenvironmental_index"
  | "environmental_index"
  | "ndvi_mean"
  | "lst_mean_celsius";

export type PanelTab = "profile" | "compare";
