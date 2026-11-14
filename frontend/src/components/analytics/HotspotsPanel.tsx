import { useMemo, useState } from "react";
import type { DistrictData } from "../../../../shared/types/geoqocha";
import { NOT_AVAILABLE, formatNumber } from "./format";
import {
  buildHotspotCollection,
  contributionsByVariable,
  priorityIcon,
  priorityLabel,
  type HotspotCollection,
  type PriorityLevel,
} from "./hotspot-rules";
import type { DatasetStatus } from "./types";
import "./panels.css";

export interface HotspotsPanelProps {
  districts: DistrictData[];
  status: DatasetStatus;
  year: number | null;
  error?: string | null;
  onRetry?: () => void;
  /** Respuesta ya calculada por el backend; si falta, se derivan reglas locales. */
  collection?: HotspotCollection | null;
  minPriority?: PriorityLevel;
}

function toneForPriority(priority: PriorityLevel): string {
  switch (priority) {
    case "high":
      return "atencion";
    case "medium":
      return "intermedia";
    default:
      return "favorable";
  }
}

function dataStatusLabel(status: DistrictData["data_status"]): string {
  switch (status) {
    case "real":
      return "Datos reales";
    case "illustrative":
      return "Datos ilustrativos";
    default:
      return "Datos insuficientes";
  }
}

function formatRuleValue(value: number | null, unit: string): string {
  if (value == null) return NOT_AVAILABLE;
  return `${formatNumber(value, { maximumFractionDigits: 3 })} ${unit}`;
}

export function HotspotsPanel({
  districts,
  status,
  year,
  error = null,
  onRetry,
  collection = null,
  minPriority: initialPriority = "medium",
}: HotspotsPanelProps) {
  const [minPriority, setMinPriority] = useState<PriorityLevel>(initialPriority);

  const resolved = useMemo<HotspotCollection>(() => {
    if (!collection) return buildHotspotCollection(districts, year, minPriority);
    const order: Record<PriorityLevel, number> = { high: 3, medium: 2, low: 1 };
    return {
      ...collection,
      hotspots: collection.hotspots.filter(
        (hotspot) => order[hotspot.priority_level] >= order[minPriority],
      ),
    };
  }, [collection, districts, year, minPriority]);

  const totals = useMemo(() => contributionsByVariable(resolved.hotspots), [resolved.hotspots]);

  if (status === "loading" || status === "idle") {
    return (
      <section className="gq-reference" aria-labelledby="gq-hotspots-title">
        <div className="gq-state" role="status" aria-live="polite">
          <span className="gq-spinner" aria-hidden="true" />
          Cargando el ranking de hotspots…
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="gq-reference" aria-labelledby="gq-hotspots-title">
        <div className="gq-state gq-state--error" role="alert">
          <strong>No se pudo cargar el ranking de hotspots.</strong>
          <p>{error ?? "Revisa la conexión e inténtalo de nuevo."}</p>
          {onRetry ? (
            <button type="button" className="gq-button" onClick={onRetry}>
              Reintentar
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="gq-reference" aria-labelledby="gq-hotspots-title">
      <header className="gq-reference-header">
        <div>
          <p className="gq-eyebrow">Análisis adicional</p>
          <h2 id="gq-hotspots-title">Hotspots con reglas explicadas</h2>
          <p>
            Distritos que activan reglas explícitas sobre tendencias, equipamiento e índice. Cada tarjeta muestra la
            regla, el valor observado, el umbral y su contribución al puntaje.
          </p>
        </div>
        <div className="gq-reference-badges">
          <span className="gq-badge gq-tone--neutral">Metodología {resolved.methodology_version}</span>
          {resolved.computed_locally ? (
            <span className="gq-badge gq-tone--intermedia">Cálculo local de desarrollo</span>
          ) : null}
        </div>
      </header>

      <div className="gq-reference-controls">
        <label className="gq-field">
          <span>Prioridad mínima</span>
          <select
            value={minPriority}
            onChange={(event) => setMinPriority(event.target.value as PriorityLevel)}
          >
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </label>
        <p className="gq-reference-meta">
          Año consultado: {year ?? NOT_AVAILABLE} · Distritos evaluados: {resolved.evaluated_districts} · Distritos
          listados: {resolved.hotspots.length}
        </p>
      </div>

      <aside className="gq-disclaimer" role="note">
        <strong>Advertencia visible</strong>
        <p>{resolved.disclaimer}</p>
        <p>
          La regla es reproducible a partir de los datos publicados y no implica causalidad. Un distrito ausente no es
          una evaluación favorable: puede no cruzar los umbrales o no tener datos suficientes.
        </p>
      </aside>

      {resolved.hotspots.length === 0 ? (
        <div className="gq-empty">
          <strong>Sin hotspots para esta prioridad</strong>
          <p>
            Ningún distrito activó reglas con prioridad {priorityLabel(minPriority).toLowerCase()} en {year ?? "el año consultado"}.
            Prueba con una prioridad mínima más baja o revisa la cobertura del dato.
          </p>
        </div>
      ) : (
        <>
          <section className="gq-reference-block" aria-labelledby="gq-contributions-title">
            <div className="gq-section-heading">
              <h3 id="gq-contributions-title">Contribución por variable</h3>
              <p>Puntos acumulados por variable en los distritos listados. La suma no es un puntaje único del ranking.</p>
            </div>
            <ul className="gq-contribution-list">
              {totals.map((total) => (
                <li key={total.variable}>
                  <span>{total.label}</span>
                  <strong>{total.points} pts</strong>
                </li>
              ))}
            </ul>
          </section>

          <ul className="gq-hotspot-list">
            {resolved.hotspots.map((hotspot) => (
              <li key={hotspot.district_id} className="gq-hotspot">
                <header className="gq-hotspot-head">
                  <div>
                    <h3>{hotspot.district_name}</h3>
                    <p className="gq-hotspot-meta">
                      Año {hotspot.year ?? NOT_AVAILABLE} · {dataStatusLabel(hotspot.data_status)}
                    </p>
                  </div>
                  <div className="gq-hotspot-score">
                    <span className={`gq-priority-chip gq-tone--${toneForPriority(hotspot.priority_level)}`}>
                      <span aria-hidden="true">{priorityIcon(hotspot.priority_level)}</span>{" "}
                      {priorityLabel(hotspot.priority_level)}
                    </span>
                    <strong>{formatNumber(hotspot.score, { maximumFractionDigits: 1 })} / 100</strong>
                  </div>
                </header>

                <p className="gq-hotspot-explanation">{hotspot.explanation}</p>

                <div className="gq-contribution-list gq-contribution-list--inline">
                  {hotspot.contributions.map((contribution) => (
                    <span
                      key={contribution.variable}
                      className={`gq-contribution-chip ${contribution.triggered ? "is-active" : ""}`}
                    >
                      {contribution.label}: {contribution.points} pts
                    </span>
                  ))}
                </div>

                <div className="gq-table-scroll">
                  <table className="gq-table">
                    <caption>Reglas evaluadas para {hotspot.district_name}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Regla</th>
                        <th scope="col">Valor observado</th>
                        <th scope="col">Umbral</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Contribución</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotspot.rules.map((rule) => (
                        <tr key={rule.rule_id} className={rule.triggered ? "is-selected" : undefined}>
                          <th scope="row">
                            {rule.rule_id}
                            <span className="gq-row-unit">{rule.description}</span>
                          </th>
                          <td>{formatRuleValue(rule.observed_value, rule.unit)}</td>
                          <td>{formatRuleValue(rule.threshold, rule.unit)}</td>
                          <td>
                            <span aria-hidden="true">{rule.triggered ? "▼" : "—"}</span>{" "}
                            {rule.triggered ? "Activada" : "No activada"}
                          </td>
                          <td>{rule.contribution} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
