import type { DistrictData } from "../../../shared/types/geoqocha";

interface MockDataset {
  contract_version: string;
  data_status: "real" | "illustrative" | "insufficient";
  generated_at: string;
  districts: DistrictData[];
}

const MOCK_URL = "/data/mock_distritos.json";
const REAL_URL = "/data/distritos_data.json";

export async function loadDistricts(): Promise<MockDataset> {
  const mode = import.meta.env.VITE_DATA_MODE ?? "mock";
  const url = mode === "real" ? REAL_URL : MOCK_URL;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
    return (await response.json()) as MockDataset;
  } catch (error) {
    if (mode === "real") {
      const fallback = await fetch(MOCK_URL);
      if (fallback.ok) return (await fallback.json()) as MockDataset;
    }
    throw error;
  }
}
