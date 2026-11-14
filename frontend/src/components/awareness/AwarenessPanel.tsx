import { useMemo } from "react";
import type { DistrictData } from "../../../../shared/types/geoqocha";
import { formatNdvi, formatSignedPercent, NOT_AVAILABLE } from "../analytics/format";
import { districtById } from "../analytics/stats";
import type { DatasetStatus } from "../analytics/types";
import { useUrlState, writeUrlPatch } from "../analytics/use-url-state";
import {
  assessAwareness,
  directionIcon,
  directionLabel,
  rankGreenCover,
  sourceLabel,
  type AwarenessDirection,
  type GreenCoverRow,
} from "./awareness-rules";
import "./awareness.css";

export interface AwarenessPanelProps {
  districts: DistrictData[];
  status: DatasetStatus;
  error?: string | null;
  year: number | null;
  onRetry?: () => void;
}

function toneForDirection(direction: AwarenessDirection): string {
  switch (direction) {
    case "loss":
      return "atencion";
    case "gain":
      return "favorable";
    case "stable":
      return "intermedia";
    default:
      return "insuficiente";
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

function ChangeCell({ row }: { row: GreenCoverRow }) {
  if (!row.change.available) {
    return <span className="gq-muted">{NOT_AVAILABLE}</span>;
  }
  return (
    <>
      {formatSignedPercent(row.change.relativePercent)}
      <span className="gq-row-unit">
        {formatNdvi(row.change.firstValue)} → {formatNdvi(row.change.lastValue)}
      </span>
    </>
  );
}

export function AwarenessPanel({ districts, status, error = null, year, onRetry }: AwarenessPanelProps) {
  const { state } = useUrlState();
  const rankings = useMemo(() => rankGreenCover(districts), [districts]);
  const selected = districtById(districts, state.districtId) ?? districts[0] ?? null;
  const assessment = useMemo(
    () => (selected ? assessAwareness(selected, districts, year) : null),
    [districts, selected, year],
  );

  if (status === "loading" || status === "idle") {
    return (
      <section className="gq-awareness" aria-labelledby="gq-awareness-title">
        <div className="gq-state" role="status" aria-live="polite">
          <span className="gq-spinner" aria-hidden="true" />
          Cargando datos para la sección de concientización…
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="gq-awareness" aria-labelledby="gq-awareness-title">
        <div className="gq-state gq-state--error" role="alert">
          <strong>No se pudieron cargar los datos de concientización.</strong>
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

  if (!assessment || !selected) {
    return (
      <section className="gq-awareness" aria-labelledby="gq-awareness-title">
        <div className="gq-empty">
          <strong>Sin distritos disponibles</strong>
          <p>La sección de concientización necesita al menos un distrito con datos.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="gq-awareness" aria-labelledby="gq-awareness-title">
      <header className="gq-awareness-header">
        <div>
          <p className="gq-eyebrow">Deforestación y concientización</p>
          <h2 id="gq-awareness-title">Pérdida verde, estrategias y mensajes ciudadanos</h2>
          <p>
            La sección describe el cambio de vigor vegetal observado en el distrito y propone acciones de
            concientización. No calcula deforestación ni afirma causas.
          </p>
        </div>
        <span className={`gq-data-badge gq-data-badge--${assessment.dataStatus}`}>
          {dataStatusLabel(assessment.dataStatus)}
        </span>
      </header>

      <div className="gq-awareness-controls">
        <label className="gq-field">
          <span>Distrito</span>
          <select
            value={selected.district_id}
            onChange={(event) => {
              const id = Number(event.target.value);
              if (Number.isInteger(id) && id > 0) writeUrlPatch({ districtId: id, panel: "awareness" });
            }}
          >
            {districts.map((district) => (
              <option key={district.district_id} value={district.district_id}>
                {district.name}
              </option>
            ))}
          </select>
        </label>
        <p className="gq-awareness-period">
          Periodo evaluado:{" "}
          {assessment.change.firstYear != null && assessment.change.lastYear != null
            ? `${assessment.change.firstYear}–${assessment.change.lastYear}`
            : NOT_AVAILABLE}
          {year != null ? ` · Año consultado: ${year}` : ""}
        </p>
      </div>

      <div className={`gq-awareness-hero gq-tone--${toneForDirection(assessment.direction)}`}>
        <p className="gq-eyebrow">Lectura del distrito</p>
        <p className="gq-awareness-headline">{assessment.headline}</p>
        <p className="gq-awareness-tag">
          <span aria-hidden="true">{directionIcon(assessment.direction)}</span> {directionLabel(assessment.direction)}
        </p>
      </div>

      <section className="gq-awareness-block" aria-labelledby="gq-strategies-title">
        <div className="gq-section-heading">
          <h3 id="gq-strategies-title">Estrategias basadas en datos</h3>
          <p>Cada estrategia se vincula con un indicador, un año y una fuente declarada. No son recomendaciones vinculantes.</p>
        </div>
        <ul className="gq-strategy-list">
          {assessment.strategies.map((strategy) => (
            <li key={strategy.id} className={`gq-strategy gq-strategy--${strategy.tone}`}>
              <div className="gq-strategy-head">
                <h4>{strategy.title}</h4>
                <span className="gq-badge gq-tone--neutral">{strategy.indicator.label}</span>
              </div>
              <p className="gq-strategy-action">{strategy.action}</p>
              <p className="gq-strategy-rationale">{strategy.rationale}</p>
              <p className="gq-strategy-meta">
                Indicador {strategy.indicator.value}
                {strategy.indicator.year != null ? ` · ${strategy.indicator.year}` : ""} · Fuente:{" "}
                {sourceLabel(strategy.sourceRef)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="gq-awareness-block" aria-labelledby="gq-messages-title">
        <div className="gq-section-heading">
          <h3 id="gq-messages-title">Mensajes ciudadanos</h3>
          <p>Frases en lenguaje llano que solo repiten hechos de la serie.</p>
        </div>
        <ul className="gq-message-list">
          {assessment.messages.map((message) => (
            <li key={message.id}>
              <p>{message.text}</p>
              <p className="gq-caveat">Base: {message.basis}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="gq-awareness-block" aria-labelledby="gq-awareness-sources-title">
        <div className="gq-section-heading">
          <h3 id="gq-awareness-sources-title">Fuentes citadas</h3>
          <p>Trazabilidad de los datos usados en esta sección.</p>
        </div>
        <ul className="gq-awareness-sources">
          {assessment.citations.map((citation) => (
            <li key={`${citation.sourceRef}-${citation.year ?? "s"}`}>
              <strong>{citation.label}</strong>
              <span>{citation.year != null ? `Año ${citation.year}. ` : ""}{citation.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="gq-awareness-block" aria-labelledby="gq-ranking-title">
        <div className="gq-section-heading">
          <h3 id="gq-ranking-title">Cambio de cobertura verde por distrito</h3>
          <p>
            Diferencia de NDVI entre el primer y el último año con dato de cada distrito. Un distrito sin dos años
            válidos se muestra como «{NOT_AVAILABLE}».
          </p>
        </div>
        <div className="gq-table-scroll">
          <table className="gq-table">
            <caption>Cambio de NDVI por distrito y periodo disponible.</caption>
            <thead>
              <tr>
                <th scope="col">Distrito</th>
                <th scope="col">Periodo</th>
                <th scope="col">Cambio relativo</th>
                <th scope="col">Lectura</th>
                <th scope="col">Estado del dato</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((row) => (
                <tr key={row.districtId} className={row.districtId === selected.district_id ? "is-selected" : undefined}>
                  <th scope="row">{row.districtName}</th>
                  <td>
                    {row.change.available && row.change.firstYear != null && row.change.lastYear != null
                      ? `${row.change.firstYear}–${row.change.lastYear}`
                      : NOT_AVAILABLE}
                  </td>
                  <td>
                    <ChangeCell row={row} />
                  </td>
                  <td>
                    <span aria-hidden="true">{directionIcon(row.direction)}</span> {directionLabel(row.direction)}
                  </td>
                  <td>{dataStatusLabel(row.dataStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="gq-awareness-caveats" aria-labelledby="gq-awareness-caveats-title">
        <h3 id="gq-awareness-caveats-title">Advertencia metodológica</h3>
        <ul>
          {assessment.caveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
