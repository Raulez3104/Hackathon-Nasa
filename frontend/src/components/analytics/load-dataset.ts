import { useCallback, useEffect, useState } from "react";
import type { DistrictDataset, DatasetState } from "./types";

export const MOCK_DATASET_URL = "/data/mock_distritos.json";
export const REAL_DATASET_URL = "/data/distritos_data.json";

export type DataMode = "mock" | "real";
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface LoadedDataset {
  dataset: DistrictDataset;
  usingFallback: boolean;
}

export function isDistrictDataset(value: unknown): value is DistrictDataset {
  if (typeof value !== "object" || value == null) return false;
  const candidate = value as Partial<DistrictDataset>;
  return (
    Array.isArray(candidate.districts) &&
    candidate.districts.length > 0 &&
    typeof candidate.contract_version === "string" &&
    (candidate.data_status === "real" ||
      candidate.data_status === "illustrative" ||
      candidate.data_status === "insufficient")
  );
}

async function fetchJson(url: string, fetchImpl: FetchLike): Promise<unknown> {
  const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (HTTP ${response.status}).`);
  }
  return response.json();
}

/** Carga el dataset real con degradación explícita al mock ilustrativo. */
export async function loadDataset(mode: DataMode, fetchImpl: FetchLike = fetch): Promise<LoadedDataset> {
  if (mode === "real") {
    try {
      const raw = await fetchJson(REAL_DATASET_URL, fetchImpl);
      if (!isDistrictDataset(raw)) throw new Error("El dataset real no cumple el contrato esperado.");
      return { dataset: raw, usingFallback: false };
    } catch {
      const fallback = await fetchJson(MOCK_DATASET_URL, fetchImpl);
      if (!isDistrictDataset(fallback)) throw new Error("El mock no cumple el contrato esperado.");
      return { dataset: fallback, usingFallback: true };
    }
  }

  const raw = await fetchJson(MOCK_DATASET_URL, fetchImpl);
  if (!isDistrictDataset(raw)) throw new Error("El mock no cumple el contrato esperado.");
  return { dataset: raw, usingFallback: false };
}

export function configuredDataMode(): DataMode {
  return import.meta.env.VITE_DATA_MODE === "real" ? "real" : "mock";
}

export interface UseDistrictDataset extends DatasetState {
  reload: () => void;
}

export function useDistrictDataset(mode: DataMode = configuredDataMode()): UseDistrictDataset {
  const [state, setState] = useState<DatasetState>({
    status: "idle",
    dataset: null,
    error: null,
    usingFallback: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, status: "loading", error: null }));

    loadDataset(mode)
      .then(({ dataset, usingFallback }) => {
        if (cancelled) return;
        setState({ status: "ready", dataset, error: null, usingFallback });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          dataset: null,
          error: error instanceof Error ? error.message : "Error desconocido al cargar los datos.",
          usingFallback: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, mode]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, reload };
}
