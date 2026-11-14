import { useEffect, useId, useRef, useState } from "react";
import type { DistrictData } from "../../../../shared/types/geoqocha";
import { ComparisonPanel } from "./ComparisonPanel";
import {
  formatArea,
  formatIndex,
  formatPopulation,
  qualityLabel,
  riskLabel,
  semaphoreForScore,
  trendDirectionLabel,
} from "./format";
import { districtById, latestSeriesPoint, trendFor } from "./stats";
import type { DatasetStatus } from "./types";
import { useFocusTrap } from "./use-focus-trap";
import { requestDiagnosis, useCrossFrontEvents, useUrlState } from "./use-url-state";
import type { PanelTab } from "./types";
import "./analytics.css";

export interface DistrictPanelProps {
  districts: DistrictData[];
  status: DatasetStatus;
  error?: string | null;
  year: number | null;
  variant?: "drawer" | "inline";
  onRetry?: () => void;
}

export function DistrictPanel({
  districts,
  status,
  error = null,
  year,
  variant = "drawer",
  onRetry,
}: DistrictPanelProps) {
  const { state, selectDistrict, closePanel, setComparison, setPanel } = useUrlState();
  const [tab, setTab] = useState<PanelTab>("profile");
  const [dismissedId, setDismissedId] = useState<number | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const tabsId = useId();

  useCrossFrontEvents(status !== "error");

  const autoOpen = state.districtId != null && state.panel == null && dismissedId !== state.districtId;
  const open = variant === "inline" || state.panel === "district" || autoOpen;
  const selected = districtById(districts, state.districtId);
  const latest = selected ? latestSeriesPoint(selected) : null;
  const icvsa = latest?.socioenvironmental_index ?? selected?.latest_socioenvironmental_index ?? null;
  const semaphore = semaphoreForScore(icvsa);
  const risk = riskLabel(selected?.risk_level);
  const ndviTrend = selected ? trendFor(selected, "ndvi") : null;
  const icvsaTrend = selected ? trendFor(selected, "socioenvironmental_index") : null;

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

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setTab((current) => (current === "profile" ? "compare" : "profile"));
  };

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
              {selected.population_year ? ` (${selected.population_year})` : ""}
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
          onKeyDown={handleTabKeyDown}
        >
          Ficha
        </button>
        <button
          type="button"
          role="tab"
          id={`${tabsId}-compare`}
          aria-selected={tab === "compare"}
          aria-controls={`${tabsId}-compare-panel`}
          className={`gq-tab ${tab === "compare" ? "is-active" : ""}`}
          onClick={() => setTab("compare")}
          onKeyDown={handleTabKeyDown}
        >
          Comparar
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
        ) : state.districtId == null ? (
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
            No se encontró el distrito {state.districtId} en el conjunto de datos.
          </div>
        ) : tab === "compare" ? (
          <ComparisonPanel
            districts={districts}
            leftId={state.compareIds[0] ?? null}
            rightId={state.compareIds[1] ?? null}
            year={year ?? selected.latest_year}
            onChange={setComparison}
            labels={{ left: "Distrito A", right: "Distrito B" }}
          />
        ) : (
          <div className="gq-profile">
            <section className={`gq-index-hero gq-tone--${semaphore.key}`} aria-labelledby={`${titleId}-icvsa`}>
              <div>
                <p className="gq-eyebrow" id={`${titleId}-icvsa`}>
                  ICVSA {latest?.year ?? selected.latest_year ?? ""}
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
            </section>

            <dl className="gq-summary-grid">
              <div>
                <dt>Calidad del dato</dt>
                <dd>{qualityLabel(latest?.data_quality_flag)}</dd>
              </div>
              <div>
                <dt>Clasificación indicativa</dt>
                <dd>
                  <span className={`gq-badge gq-tone--${risk.key}`}>
                    <span aria-hidden="true">{risk.icon}</span> {risk.label}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Tendencia NDVI</dt>
                <dd>{ndviTrend ? trendDirectionLabel(ndviTrend.direction) : "No disponible"}</dd>
              </div>
              <div>
                <dt>Tendencia ICVSA</dt>
                <dd>{icvsaTrend ? trendDirectionLabel(icvsaTrend.direction) : "No disponible"}</dd>
              </div>
            </dl>

            <div className="gq-panel-actions">
              <button
                type="button"
                className="gq-button"
                onClick={() => requestDiagnosis(selected.district_id, year ?? selected.latest_year ?? 2025)}
              >
                Ver diagnóstico automático
              </button>
              <button
                type="button"
                className="gq-button gq-button--ghost"
                onClick={() => {
                  setComparison([selected.district_id, state.compareIds[1] ?? districts.find((d) => d.district_id !== selected.district_id)?.district_id ?? 1]);
                  setTab("compare");
                }}
              >
                Comparar distrito
              </button>
            </div>

            <p className="gq-source-note">
              Fuentes declaradas: {selected.source_refs.length > 0 ? selected.source_refs.join(", ") : "sin fuente declarada"}.
              {selected.data_status === "illustrative" ? " Datos ilustrativos de desarrollo." : ""}
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
