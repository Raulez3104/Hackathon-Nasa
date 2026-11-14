import type { DistrictData, Variable } from "../../../../shared/types/geoqocha";

export type IndexView = "numeric" | "semaphore";

export type WmsLayerStatus = "idle" | "loading" | "ready" | "error" | "unavailable";

export interface MapProps {
  districts: DistrictData[];
  year: number;
  variable: Variable;
  indexView: IndexView;
  selectedDistrictId: number | null;
  showLstHeatmap: boolean;
  onDistrictSelect: (districtId: number) => void;
}
