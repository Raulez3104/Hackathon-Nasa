import type { DistrictData, Variable } from "../../../../shared/types/geoqocha";

export type IndexView = "numeric" | "semaphore";

export interface MapProps {
  districts: DistrictData[];
  year: number;
  variable: Variable;
  indexView: IndexView;
  selectedDistrictId: number | null;
  showLstHeatmap: boolean;
  onDistrictSelect: (districtId: number) => void;
}
