import { useMemo } from "react";
import type { DistrictData } from "../../../../shared/types/geoqocha";
import { NOT_AVAILABLE, formatFractionPercent, formatInteger, formatNumber, qualityLabel } from "./format";
import {
  DEFAULT_METHODOLOGY,
  referenceYears,
  summarizeQuality,
  temporalPolicyLabel,
  weightsSum,
  type MethodologyDocument,
} from "./methodology-data";
import type { DatasetStatus } from "./types";
import "./panels.css";

export interface MethodologyPanelProps {
  districts?: DistrictData[];
  status?: DatasetStatus;
  year?: number | null;
  error?: string | null;
  onRetry?: () => void;
  methodology?: MethodologyDocument | null;
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

export function MethodologyPanel({
  districts = [],
  status = "ready",
  year = null,
  error = null,
  onRetry,
  methodology = null,
}: MethodologyPanelProps) {
  const document = methodology ?? DEFAULT_METHODOLOGY;
  const total = weightsSum(document.index.weights);
  const years = useMemo(() => referenceYears(districts), [districts]);
  const quality = useMemo(
    () => (districts.length > 0 ? summarizeQuality(districts, year) : null),
    [districts, year],
  );

  if (status === "loading" || status === "idle") {
    return (
      <section className="gq-reference" aria-labelledby="gq-methodology-title">
        <div className="gq-state" role="status" aria-live="polite">
          <span className="gq-spinner" aria-hidden="true" />
          Cargando la metodología publicada…
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="gq-reference" aria-labelledby="gq-methodology-title">
        <div className="gq-state gq-state--error" role="alert">
          <strong>No se pudo cargar la metodología.</strong>
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
    <section className="gq-reference" aria-labelledby="gq-methodology-title">
      <header className="gq-reference-header">
        <div>
          <p className="gq-eyebrow">Transparencia</p>
          <h2 id="gq-methodology-title">Metodología del ICVSA</h2>
          <p>
            Fórmula, pesos, política temporal y tratamiento de datos faltantes. La misma información acompaña a las
            cifras del tablero.
          </p>
        </div>
        <div className="gq-reference-badges">
          <span className="gq-badge gq-tone--neutral">Versión {document.version}</span>
          <span className="gq-badge gq-tone--neutral">Escala {document.index.scale[0]}–{document.index.scale[1]}</span>
        </div>
      </header>

      <section className="gq-reference-block" aria-labelledby="gq-formula-title">
        <div className="gq-section-heading">
          <h3 id="gq-formula-title">{document.index.name}</h3>
          <p>Las vistas numérica y semaforizada usan la misma escala y los mismos pesos.</p>
        </div>
        <pre className="gq-formula">
          <code>{document.index.formula}</code>
        </pre>
      </section>

      <section className="gq-reference-block" aria-labelledby="gq-weights-title">
        <div className="gq-section-heading">
          <h3 id="gq-weights-title">Pesos publicados</h3>
          <p>
            Los pesos no se renormalizan en silencio: si falta una dimensión completa se publica{" "}
            <code>{document.index.sensitivity.field}</code>.
          </p>
        </div>
        <div className="gq-table-scroll">
          <table className="gq-table">
            <caption>Pesos del ICVSA y comprobación de la suma.</caption>
            <thead>
              <tr>
                <th scope="col">Dimensión</th>
                <th scope="col">Peso</th>
                <th scope="col">Participación</th>
              </tr>
            </thead>
            <tbody>
              {document.index.weights.map((item) => (
                <tr key={item.key}>
                  <th scope="row">{item.label}</th>
                  <td>{formatNumber(item.weight, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>
                    <div className="gq-weight-bar" aria-hidden="true">
                      <span style={{ width: `${Math.round(item.weight * 100)}%` }} />
                    </div>
                    {formatFractionPercent(item.weight, 0)}
                  </td>
                </tr>
              ))}
              <tr className="gq-weight-total">
                <th scope="row">Suma de pesos</th>
                <td>{formatNumber(total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{formatFractionPercent(total, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="gq-reference-block" aria-labelledby="gq-temporal-title">
        <div className="gq-section-heading">
          <h3 id="gq-temporal-title">Política temporal</h3>
          <p>El ambiente es anual; el territorio se fija en su año de referencia y no se interpola.</p>
        </div>
        <dl className="gq-definition-grid">
          <div>
            <dt>Componente ambiental</dt>
            <dd>{document.index.temporal_policy.environmental === "annual" ? "Anual" : document.index.temporal_policy.environmental}</dd>
          </div>
          <div>
            <dt>Componente territorial</dt>
            <dd>{temporalPolicyLabel(document.index.temporal_policy)}</dd>
          </div>
          <div>
            <dt>Año de referencia territorial (t_ref)</dt>
            <dd>
              {years.length > 0
                ? years.join(", ")
                : (document.index.temporal_policy.territorial_reference_year ?? NOT_AVAILABLE)}
            </dd>
          </div>
          <div>
            <dt>Interpolación permitida</dt>
            <dd>
              <span aria-hidden="true">{document.index.temporal_policy.interpolation_allowed ? "▲" : "—"}</span>{" "}
              {document.index.temporal_policy.interpolation_allowed ? "Sí" : "No"}
            </dd>
          </div>
        </dl>
        {years.length > 1 ? (
          <p className="gq-caveat">
            Los distritos declaran años de referencia distintos ({years.join(", ")}). No se unifican ni se extrapolan.
          </p>
        ) : null}
      </section>

      <section className="gq-reference-block" aria-labelledby="gq-missing-title">
        <div className="gq-section-heading">
          <h3 id="gq-missing-title">Normalización y datos faltantes</h3>
        </div>
        <dl className="gq-definition-grid">
          <div>
            <dt>Normalización</dt>
            <dd>{document.index.normalization}</dd>
          </div>
          <div>
            <dt>Política de faltantes</dt>
            <dd>{document.index.missing_data_policy}</dd>
          </div>
          <div>
            <dt>Sensibilidad</dt>
            <dd>
              <code>{document.index.sensitivity.field}</code>: {document.index.sensitivity.description}
            </dd>
          </div>
        </dl>
      </section>

      <section className="gq-reference-block" aria-labelledby="gq-classification-title">
        <div className="gq-section-heading">
          <h3 id="gq-classification-title">Clasificación del índice</h3>
          <p>Cada rango se acompaña de texto e ícono; el color no es el único portador del significado.</p>
        </div>
        <ul className="gq-classification-list">
          {document.index.classification.map((item) => (
            <li key={item.label} className={`gq-tone--${item.tone}`}>
              <span aria-hidden="true">{item.tone === "favorable" ? "▲" : item.tone === "intermedia" ? "■" : "▼"}</span>
              <strong>{item.label}</strong>
              <span>
                {formatInteger(item.range[0])}–{formatInteger(item.range[1])}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {quality ? (
        <section className="gq-reference-block" aria-labelledby="gq-quality-title">
          <div className="gq-section-heading">
            <h3 id="gq-quality-title">Calidad del dato en la interfaz</h3>
            <p>
              Cobertura del año consultado ({quality.year ?? NOT_AVAILABLE}). Los vacíos se muestran como «
              {NOT_AVAILABLE}» y nunca se imputan como cero.
            </p>
          </div>
          <ul className="gq-quality-summary">
            <li>
              <strong>{quality.evaluated}</strong>
              <span>distritos evaluados</span>
            </li>
            <li>
              <strong>{quality.ok}</strong>
              <span>calidad completa</span>
            </li>
            <li>
              <strong>{quality.partial}</strong>
              <span>calidad parcial</span>
            </li>
            <li>
              <strong>{quality.insufficient}</strong>
              <span>datos insuficientes</span>
            </li>
            <li>
              <strong>{quality.withoutPoint}</strong>
              <span>sin observación en el año</span>
            </li>
          </ul>
          <p className="gq-reference-meta">
            Periodo disponible: {quality.firstYear ?? NOT_AVAILABLE}–{quality.lastYear ?? NOT_AVAILABLE} · Vacíos: NDVI{" "}
            {quality.missingNdvi}, LST {quality.missingLst}, ICVSA {quality.missingIndex}.
          </p>
          <div className="gq-table-scroll">
            <table className="gq-table">
              <caption>Calidad y cobertura por distrito en {quality.year ?? "el año consultado"}.</caption>
              <thead>
                <tr>
                  <th scope="col">Distrito</th>
                  <th scope="col">Calidad</th>
                  <th scope="col">NDVI</th>
                  <th scope="col">LST</th>
                  <th scope="col">ICVSA</th>
                  <th scope="col">Estado del dato</th>
                </tr>
              </thead>
              <tbody>
                {quality.rows.map((row) => (
                  <tr key={row.districtId}>
                    <th scope="row">{row.districtName}</th>
                    <td>{qualityLabel(row.flag)}</td>
                    <td>{row.hasNdvi ? "Con dato" : NOT_AVAILABLE}</td>
                    <td>{row.hasLst ? "Con dato" : NOT_AVAILABLE}</td>
                    <td>{row.hasIndex ? "Con dato" : NOT_AVAILABLE}</td>
                    <td>{dataStatusLabel(row.dataStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="gq-empty">
          <strong>Sin dataset cargado</strong>
          <p>La metodología se muestra completa; la cobertura por distrito aparecerá cuando haya datos.</p>
        </div>
      )}

      <aside className="gq-disclaimer" role="note">
        <strong>Advertencia metodológica</strong>
        <p>{document.disclaimer}</p>
      </aside>
    </section>
  );
}
