import { useEffect, useId, useRef, useState } from "react";
import type { DistrictData } from "../../../../shared/types/geoqocha";
import { DistrictProfile } from "./DistrictProfile";
import { SeriesChart } from "./SeriesChart";
import {
  formatArea,
  formatIndex,
  formatPopulation,
  formatPopulationDensity,
  populationLevel,
  riskLabel,
  semaphoreForScore,
} from "./format";
import { districtById, latestSeriesPoint } from "./stats";
import type { DatasetStatus } from "./types";
import { useFocusTrap } from "./use-focus-trap";
import { useCrossFrontEvents, useUrlState } from "./use-url-state";
import type { PanelTab } from "./types";
import "./analytics.css";

export interface DistrictPanelProps {
  districts: DistrictData[];
  status: DatasetStatus;
  error?: string | null;
  year: number | null;
  variant?: "drawer" | "inline";
  selectedDistrictId?: number | null;
  onRetry?: () => void;
}

export function DistrictPanel({
  districts,
  status,
  error = null,
  year,
  variant = "drawer",
  selectedDistrictId,
  onRetry,
}: DistrictPanelProps) {
  const { state, selectDistrict, closePanel, setPanel } = useUrlState();
  const [tab, setTab] = useState<PanelTab>("profile");
  const [dismissedId, setDismissedId] = useState<number | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const tabsId = useId();
  const effectiveDistrictId = variant === "inline" && selectedDistrictId !== undefined
    ? selectedDistrictId
    : state.districtId;

  useCrossFrontEvents(status !== "error");

  const autoOpen = state.districtId != null && state.panel == null && dismissedId !== state.districtId;
  const open = variant === "inline" || state.panel === "district" || autoOpen;
  const selected = districtById(districts, effectiveDistrictId);
  const latest = selected ? latestSeriesPoint(selected) : null;
  const selectedPoint = selected?.series.find((point) => point.year === year) ?? latest;
  const displayYear = year ?? selectedPoint?.year ?? selected?.latest_year ?? null;
  const icvsa = selectedPoint?.socioenvironmental_index
    ?? (displayYear === selected?.latest_year ? selected?.latest_socioenvironmental_index : null);
  const semaphore = semaphoreForScore(icvsa);
  const risk = riskLabel(selected?.risk_level);

  useEffect(() => {
    if (variant !== "drawer" || state.panel != null || state.districtId == null) return;
    if (dismissedId === state.districtId) return;
    setPanel("district");
  }, [dismissedId, setPanel, state.districtId, state.panel, variant]);

  const handleClose = () => {
    setDismissedId(state.districtId);
    closePanel();
  };

  useFocusTrap(panelRef, open && variant === "drawer", handleClose);

  if (!open) return null;

  const content = (
    <aside
      ref={panelRef}
      className={`gq-panel gq-panel--${variant}`}
      role={variant === "drawer" ? "dialog" : "region"}
      aria-modal={variant === "drawer" ? "true" : undefined}
      aria-labelledby={titleId}
    >
      <header className="gq-panel-header">
        <div>
          <p className="gq-eyebrow">Ficha distrital</p>
          <h2 id={titleId}>{selected ? selected.name : "Panel distrital"}</h2>
          {selected ? (
            <p className="gq-panel-subtitle">
               Distrito {selected.district_id} · {formatArea(selected.area_km2)} ·{" "}
               {formatPopulation(selected.population)}
               {selected.population_year ? ` (${selected.population_year})` : ""} · Nivel poblacional: {populationLevel(selected.population)}
            </p>
          ) : null}
        </div>
        {variant === "drawer" ? (
          <button type="button" className="gq-icon-button" onClick={handleClose} aria-label="Cerrar panel distrital">
            ×
          </button>
        ) : null}
      </header>

      <div className="gq-panel-tabs" role="tablist" aria-label="Contenido del panel distrital">
        <button
          type="button"
          role="tab"
          id={`${tabsId}-profile`}
          aria-selected={tab === "profile"}
          aria-controls={`${tabsId}-profile-panel`}
          className={`gq-tab ${tab === "profile" ? "is-active" : ""}`}
          onClick={() => setTab("profile")}
        >
          Ficha
        </button>
      </div>

      <div
        className="gq-panel-body"
        id={`${tabsId}-${tab}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-${tab}`}
      >
        {status === "loading" || status === "idle" ? (
          <div className="gq-state" role="status" aria-live="polite">
            <span className="gq-spinner" aria-hidden="true" />
            Cargando datos de los distritos…
          </div>
        ) : status === "error" ? (
          <div className="gq-state gq-state--error" role="alert">
            <strong>No se pudieron cargar los datos.</strong>
            <p>{error ?? "Revisa la conexión e inténtalo de nuevo."}</p>
            {onRetry ? (
              <button type="button" className="gq-button" onClick={onRetry}>
                Reintentar
              </button>
            ) : null}
          </div>
        ) : effectiveDistrictId == null ? (
          <div className="gq-empty">
            <strong>Selecciona un distrito</strong>
            <p>Elige un distrito para ver su ficha, sus brechas y su serie histórica.</p>
            <label className="gq-field">
              <span>Distrito</span>
              <select
                value=""
                onChange={(event) => {
                  const id = Number(event.target.value);
                  if (Number.isInteger(id) && id > 0) selectDistrict(id);
                }}
              >
                <option value="">Selecciona…</option>
                {districts.map((district) => (
                  <option key={district.district_id} value={district.district_id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : !selected ? (
          <div className="gq-state gq-state--error" role="alert">
            No se encontró el distrito {effectiveDistrictId} en el conjunto de datos.
          </div>
        ) : (
          <div className="gq-profile">
            <section className={`gq-index-hero gq-tone--${semaphore.key}`} aria-labelledby={`${titleId}-icvsa`}>
              <div>
                <p className="gq-eyebrow" id={`${titleId}-icvsa`}>
                   ICVSA {displayYear ?? ""}
                </p>
                <p className="gq-index-value">
                  {formatIndex(icvsa)} <span>/ 100</span>
                </p>
              </div>
              <p className="gq-semaphore">
                <span className="gq-semaphore-icon" aria-hidden="true">
                  {semaphore.icon}
                </span>
                {semaphore.label}
              </p>
              <p className="gq-caveat">
                Indicador sintético de apoyo al análisis; no es una evaluación oficial del GAMC.
              </p>
              <p>
                <span className={`gq-badge gq-tone--${risk.key}`}>
                  <span aria-hidden="true">{risk.icon}</span> {risk.label}
                </span>
              </p>
            </section>

             <DistrictProfile district={selected} districts={districts} year={displayYear} />
             <SeriesChart primary={selected} year={displayYear} />

             <p className="gq-source-note">
              Fuentes declaradas: {selected.source_refs.length > 0 ? selected.source_refs.join(", ") : "sin fuente declarada"}.
              {selected.data_status === "illustrative" ? " Serie complementada en años sin observación real." : ""}
            </p>
          </div>
        )}
      </div>
    </aside>
  );

  if (variant === "inline") return content;

  return (
    <div
      className="gq-panel-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      {content}
    </div>
  );
}
