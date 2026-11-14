import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Variable } from "../../../../shared/types/geoqocha";
import type { IndexView } from "./map.types";
import { GAMC_LAYERS } from "../../services/wms/catalog";

export const MAP_URL_CHANGED_EVENT = "geoqocha:map-url-changed";
export const DISTRICT_SELECTED_EVENT = "geoqocha:district-selected";

const VARIABLES: Variable[] = ["icvsa", "environmental_index", "ndvi", "lst", "priority", "equipment", "mobility"];
const VIEWS: IndexView[] = ["numeric", "semaphore"];
const MIN_YEAR = 2015;
const MAX_YEAR = 2025;

export interface MapUrlState {
  districtId: number | null;
  compareIds: number[];
  year: number;
  variable: Variable;
  view: IndexView;
  layers: string[];
}

function validDistrict(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id >= 1 && id <= 15 ? id : null;
}

function validYear(value: string | null): number {
  if (!value || !/^\d{4}$/.test(value)) return 2025;
  const year = Number(value);
  return year >= MIN_YEAR && year <= MAX_YEAR ? year : 2025;
}

export function readMapUrlState(search: string): MapUrlState {
  const params = new URLSearchParams(search);
  const compareIds = [...new Set(
    (params.get("districts") ?? "")
      .split(",")
      .map((value) => validDistrict(value.trim()))
      .filter((value): value is number => value !== null),
  )].slice(0, 2);
  const variable = params.get("variable") as Variable;
  const view = params.get("view") as IndexView;
  const layers = [...new Set((params.get("layers") ?? "").split(",").filter(Boolean))];
  return {
    districtId: validDistrict(params.get("district")),
    compareIds,
    year: validYear(params.get("year")),
    variable: VARIABLES.includes(variable) ? variable : "icvsa",
    view: VIEWS.includes(view) ? view : "numeric",
    layers,
  };
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(MAP_URL_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(MAP_URL_CHANGED_EVENT, callback);
  };
}

function updateUrl(patch: Partial<MapUrlState>): void {
  const url = new URL(window.location.href);
  const next = readMapUrlState(url.search);
  const state = { ...next, ...patch };
  const setOrDelete = (name: string, value: string | null) => {
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
  };
  setOrDelete("district", state.districtId == null ? null : String(state.districtId));
  setOrDelete("districts", state.compareIds.length ? state.compareIds.join(",") : null);
  setOrDelete("year", String(state.year));
  setOrDelete("variable", state.variable);
  setOrDelete("view", state.view);
  const validLayers = state.layers.filter((layer) =>
    layer === "lst" || layer === "transport" || layer === "transport_stops"
      || GAMC_LAYERS.some((definition) => definition.id === layer));
  setOrDelete("layers", validLayers.length ? [...new Set(validLayers)].join(",") : null);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new CustomEvent(MAP_URL_CHANGED_EVENT));
}

export function useMapUrlState() {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  const state = useMemo(() => readMapUrlState(search), [search]);

  const selectDistrict = useCallback((districtId: number | null) => {
    updateUrl({ districtId });
    if (districtId != null) {
      window.dispatchEvent(new CustomEvent(DISTRICT_SELECTED_EVENT, { detail: { district_id: districtId } }));
    }
  }, []);
  const setComparison = useCallback((compareIds: number[]) => updateUrl({ compareIds: compareIds.slice(0, 2) }), []);
  const setYear = useCallback((year: number) => updateUrl({ year }), []);
  const setVariable = useCallback((variable: Variable) => updateUrl({ variable }), []);
  const setView = useCallback((view: IndexView) => updateUrl({ view }), []);
  const setLayers = useCallback((layers: string[]) => updateUrl({ layers }), []);

  return { state, selectDistrict, setComparison, setYear, setVariable, setView, setLayers };
}
