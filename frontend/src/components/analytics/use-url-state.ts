import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

export const URL_CHANGED_EVENT = "geoqocha:url-changed";
export const DISTRICT_SELECTED_EVENT = "geoqocha:district-selected";
export const YEAR_CHANGED_EVENT = "geoqocha:year-changed";

export const MIN_YEAR = 2015;
export const MAX_YEAR = 2025;
export const MIN_DISTRICT_ID = 1;
export const MAX_DISTRICT_ID = 15;
export const MAX_COMPARISON_DISTRICTS = 5;

export type PanelName = "district" | "chat" | "awareness";

export interface UrlState {
  districtId: number | null;
  compareIds: number[];
  year: number | null;
  panel: PanelName | null;
}

const PANEL_NAMES: PanelName[] = ["district", "chat", "awareness"];

function parseInteger(raw: string | null): number | null {
  if (raw == null || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

export function parseDistrictId(raw: string | null): number | null {
  const value = parseInteger(raw);
  if (value == null) return null;
  return value >= MIN_DISTRICT_ID && value <= MAX_DISTRICT_ID ? value : null;
}

export function parseComparisonIds(raw: string | null): number[] {
  if (!raw) return [];
  const ids: number[] = [];
  for (const token of raw.split(",")) {
    const id = parseDistrictId(token.trim());
    if (id != null && !ids.includes(id)) ids.push(id);
    if (ids.length >= MAX_COMPARISON_DISTRICTS) break;
  }
  return ids;
}

export function parseYear(raw: string | null): number | null {
  const value = parseInteger(raw);
  if (value == null) return null;
  return value >= MIN_YEAR && value <= MAX_YEAR ? value : null;
}

export function parsePanel(raw: string | null): PanelName | null {
  return PANEL_NAMES.includes(raw as PanelName) ? (raw as PanelName) : null;
}

export function readUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  return {
    districtId: parseDistrictId(params.get("district")),
    compareIds: parseComparisonIds(params.get("districts")),
    year: parseYear(params.get("year")),
    panel: parsePanel(params.get("panel")),
  };
}

export interface UrlPatch {
  districtId?: number | null;
  compareIds?: number[] | null;
  year?: number | null;
  panel?: PanelName | null;
}

function applyPatch(params: URLSearchParams, patch: UrlPatch): void {
  if (patch.districtId !== undefined) {
    if (patch.districtId == null) params.delete("district");
    else params.set("district", String(patch.districtId));
  }
  if (patch.compareIds !== undefined) {
    const ids = (patch.compareIds ?? []).filter(
      (id) => Number.isInteger(id) && id >= MIN_DISTRICT_ID && id <= MAX_DISTRICT_ID,
    );
    if (ids.length === 0) params.delete("districts");
    else params.set("districts", ids.join(","));
  }
  if (patch.year !== undefined) {
    if (patch.year == null) params.delete("year");
    else params.set("year", String(patch.year));
  }
  if (patch.panel !== undefined) {
    if (patch.panel == null) params.delete("panel");
    else params.set("panel", patch.panel);
  }
}

/**
 * Escribe el estado del panel en la URL sin recargar y conserva los
 * parámetros de otros frentes (`variable`, `view`, `layers`, etc.).
 */
export function writeUrlPatch(patch: UrlPatch, replace = true): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  applyPatch(url.searchParams, patch);
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (replace) window.history.replaceState(window.history.state, "", next);
  else window.history.pushState(window.history.state, "", next);
  window.dispatchEvent(new CustomEvent(URL_CHANGED_EVENT));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(URL_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(URL_CHANGED_EVENT, callback);
  };
}

export interface UrlStateActions {
  state: UrlState;
  selectDistrict: (districtId: number | null) => void;
  setComparison: (ids: number[]) => void;
  selectYear: (year: number | null) => void;
  setPanel: (panel: PanelName | null) => void;
  closePanel: () => void;
}

/**
 * La URL es la fuente de verdad para `district`, `districts`, `year` y `panel`.
 */
export function useUrlState(): UrlStateActions {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  const state = useMemo(() => readUrlState(search), [search]);

  const selectDistrict = useCallback((districtId: number | null) => {
    writeUrlPatch({ districtId, panel: districtId == null ? null : "district" });
  }, []);

  const setComparison = useCallback((ids: number[]) => {
    writeUrlPatch({ compareIds: ids, panel: "district" });
  }, []);

  const selectYear = useCallback((year: number | null) => {
    writeUrlPatch({ year });
  }, []);

  const setPanel = useCallback((panel: PanelName | null) => {
    writeUrlPatch({ panel });
  }, []);

  const closePanel = useCallback(() => {
    writeUrlPatch({ panel: null });
  }, []);

  return { state, selectDistrict, setComparison, selectYear, setPanel, closePanel };
}

/**
 * Escucha los eventos opcionales de DEV1. La URL sigue siendo la fuente de
 * verdad: si un evento falta, la vista se recupera al recargar el enlace.
 */
export function useCrossFrontEvents(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const syncSelection = (event: Event) => {
      const detail = (event as CustomEvent<{ district_id?: number }>).detail;
      const id = parseDistrictId(detail?.district_id != null ? String(detail.district_id) : null);
      if (id != null) writeUrlPatch({ districtId: id, panel: "district" });
    };

    const syncYear = (event: Event) => {
      const detail = (event as CustomEvent<{ year?: number }>).detail;
      const year = parseYear(detail?.year != null ? String(detail.year) : null);
      if (year != null) writeUrlPatch({ year });
    };

    window.addEventListener(DISTRICT_SELECTED_EVENT, syncSelection);
    window.addEventListener(YEAR_CHANGED_EVENT, syncYear);
    return () => {
      window.removeEventListener(DISTRICT_SELECTED_EVENT, syncSelection);
      window.removeEventListener(YEAR_CHANGED_EVENT, syncYear);
    };
  }, [enabled]);
}

/** Abre el diagnóstico de DEV2/DEV3 desde cualquier botón del panel. */
export function requestDiagnosis(districtId: number, year: number): void {
  window.dispatchEvent(
    new CustomEvent("geoqocha:open-diagnosis", {
      detail: { district_id: districtId, year },
    }),
  );
}
