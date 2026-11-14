import { useMemo, useState } from "react";
import { NOT_AVAILABLE } from "./format";
import { SOURCE_CATALOG, type SourceEntry, type SourceKind } from "./source-catalog";
import type { DatasetStatus } from "./types";
import "./panels.css";

export interface SourcesPanelProps {
  sources?: SourceEntry[];
  status?: DatasetStatus;
  error?: string | null;
  onRetry?: () => void;
}

export function kindLabel(kind: SourceKind): string {
  return kind === "real" ? "Dato real documentado" : "Dato ilustrativo";
}

export function SourcesPanel({
  sources = SOURCE_CATALOG,
  status = "ready",
  error = null,
  onRetry,
}: SourcesPanelProps) {
  const [filter, setFilter] = useState<"all" | SourceKind>("all");
  const visible = useMemo(
    () => (filter === "all" ? sources : sources.filter((source) => source.kind === filter)),
    [filter, sources],
  );
  const realCount = sources.filter((source) => source.kind === "real").length;
  const illustrativeCount = sources.filter((source) => source.kind === "illustrative").length;

  if (status === "loading" || status === "idle") {
    return (
      <section className="gq-reference" aria-labelledby="gq-sources-title">
        <div className="gq-state" role="status" aria-live="polite">
          <span className="gq-spinner" aria-hidden="true" />
          Cargando el catálogo de fuentes…
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="gq-reference" aria-labelledby="gq-sources-title">
        <div className="gq-state gq-state--error" role="alert">
          <strong>No se pudo cargar el catálogo de fuentes.</strong>
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
    <section className="gq-reference" aria-labelledby="gq-sources-title">
      <header className="gq-reference-header">
        <div>
          <p className="gq-eyebrow">Trazabilidad</p>
          <h2 id="gq-sources-title">Catálogo de fuentes</h2>
          <p>
            Origen, licencia, transformaciones y limitaciones de cada insumo. Los datos reales se distinguen de los
            ilustrativos en todo el tablero.
          </p>
        </div>
        <div className="gq-reference-badges">
          <span className="gq-badge gq-tone--favorable">
            <span aria-hidden="true">▲</span> {realCount} reales
          </span>
          <span className="gq-badge gq-tone--intermedia">
            <span aria-hidden="true">■</span> {illustrativeCount} ilustrativas
          </span>
        </div>
      </header>

      <div className="gq-reference-controls">
        <label className="gq-field">
          <span>Tipo de fuente</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as "all" | SourceKind)}>
            <option value="all">Todas</option>
            <option value="real">Solo reales documentadas</option>
            <option value="illustrative">Solo ilustrativas</option>
          </select>
        </label>
        <p className="gq-reference-meta">
          {visible.length} de {sources.length} fuentes visibles.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="gq-empty">
          <strong>Sin fuentes para este filtro</strong>
          <p>Cambia el tipo de fuente para ver el catálogo completo o revisa los metadatos publicados.</p>
        </div>
      ) : (
        <ul className="gq-source-list">
          {visible.map((source) => (
            <li key={source.id} className={`gq-source gq-source--${source.kind}`}>
              <header className="gq-source-head">
                <div>
                  <h3>{source.name}</h3>
                  <p className="gq-source-org">
                    {source.organization} · {source.reference_date}
                  </p>
                </div>
                <span className={`gq-badge gq-tone--${source.kind === "real" ? "favorable" : "intermedia"}`}>
                  <span aria-hidden="true">{source.kind === "real" ? "▲" : "■"}</span> {kindLabel(source.kind)}
                </span>
              </header>

              <dl className="gq-source-meta">
                <div>
                  <dt>Licencia</dt>
                  <dd>{source.license}</dd>
                </div>
                <div>
                  <dt>Enlace</dt>
                  <dd>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer noopener">
                        {source.url}
                      </a>
                    ) : (
                      NOT_AVAILABLE
                    )}
                  </dd>
                </div>
              </dl>

              <div className="gq-source-columns">
                <section aria-labelledby={`${source.id}-transformations`}>
                  <h4 id={`${source.id}-transformations`}>Transformaciones</h4>
                  <ul>
                    {source.transformations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby={`${source.id}-limitations`}>
                  <h4 id={`${source.id}-limitations`}>Limitaciones</h4>
                  <ul>
                    {source.limitations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </li>
          ))}
        </ul>
      )}

      <aside className="gq-disclaimer" role="note">
        <strong>Licencias y atribución</strong>
        <p>
          Código MIT y documentación CC BY 4.0. Los datos municipales se publican solo si sus términos lo permiten y
          siempre con atribución. Las fuentes marcadas como ilustrativas no son evidencia oficial.
        </p>
      </aside>
    </section>
  );
}
