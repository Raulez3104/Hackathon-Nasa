import type { DistrictData } from "./geoqocha";

export interface MockDataset {
  contract_version: "0.1.0";
  data_status: "illustrative";
  generated_at: string;
  districts: DistrictData[];
}
