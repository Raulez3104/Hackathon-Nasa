import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { AIInsight, AIRequest, AIResponse, DistrictData } from "../../../../shared/types/geoqocha";
import { NOT_AVAILABLE, formatDate } from "../analytics/format";
import { districtById } from "../analytics/stats";
import { useUrlState } from "../analytics/use-url-state";
import { AIClientError, postAIRequest, shouldUseLocalFallback } from "./ai-client";
import { buildLocalResponse } from "./local-fallback";
import "./chat.css";
import "./diagnosis.css";

export const OPEN_DIAGNOSIS_EVENT = "geoqocha:open-diagnosis";

type DiagnosisStatus = "idle" | "loading" | "ready" | "error";

export interface DiagnosisCardsProps {
  districts: DistrictData[];
  year: number | null;
  districtId?: number | null;
  endpoint?: string;
  fetchImpl?: typeof fetch;
  /** Dispara el diagnóstico al montar; útil en vistas dedicadas y pruebas. */
  autoLoad?: boolean;
}

interface DiagnosisRequestDetail {
  district_id?: number;
  year?: number;
}

function severityLabel(severity: AIInsight["severity"]): { label: string; icon: string } {
  switch (severity) {
    case "critical":
      return { label: "Crítico", icon: "!!" };
    case "warning":
      return { label: "Advertencia", icon: "!" };
    default:
      return { label: "Informativo", icon: "i" };
  }
}

function kindLabel(kind: AIInsight["kind"]): string {
  switch (kind) {
    case "observation":
      return "Observación";
    case "risk":
      return "Riesgo";
    case "recommendation":
      return "Acción sugerida";
    case "caveat":
      return "Advertencia metodológica";
    default:
      return kind;
  }
}

function evidenceValue(value: number | string | null): string {
  if (value == null) return NOT_AVAILABLE;
  if (typeof value === "number") {
    return new Intl.NumberFormat("es-BO", { maximumFractionDigits: 3 }).format(value);
  }
  return value;
}

function collectSources(response: AIResponse): string[] {
  const refs = new Set<string>();
  response.citations.forEach((citation) => refs.add(citation.label));
  response.insights.forEach((insight) =>
    insight.evidence.forEach((evidence) => refs.add(evidence.source_ref)),
  );
  return [...refs];
}

/**
 * Consume `mode: "diagnosis"` y renderiza las tarjetas con severidad,
 * evidencia y citas. Si la API falla, mantiene la sección y ofrece reintento
 * o la respuesta por reglas local.
 */
export function DiagnosisCards({
  districts,
  year,
  districtId = null,
  endpoint,
  fetchImpl,
  autoLoad = false,
}: DiagnosisCardsProps) {
  const { state } = useUrlState();
  const [targetId, setTargetId] = useState<number | null>(districtId ?? state.districtId ?? null);
  const [targetYear, setTargetYear] = useState<number | null>(year);
  const [status, setStatus] = useState<DiagnosisStatus>("idle");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [local, setLocal] = useState(false);
  const titleId = useId();

  const selected = useMemo(() => districtById(districts, targetId), [districts, targetId]);
  const effectiveYear = targetYear ?? selected?.latest_year ?? year;

  const run = useCallback(
    async (id: number | null, requestedYear: number | null, options: { forceLocal?: boolean } = {}) => {
      if (id == null) return;
      const district = districtById(districts, id);
      const request: AIRequest = {
        mode: "diagnosis",
        district_id: id,
        locale: "es",
        ...(requestedYear != null ? { year: requestedYear } : {}),
      };

      setTargetId(id);
      setTargetYear(requestedYear);
      setStatus("loading");
      setError(null);

      const resolveLocal = () => {
        setResponse(buildLocalResponse(request, district));
        setLocal(true);
        setStatus("ready");
      };

      if (options.forceLocal) {
        resolveLocal();
        return;
      }

      try {
        const result = await postAIRequest(request, { endpoint, fetchImpl });
        setResponse(result);
        setLocal(result.fallback_used);
        setStatus("ready");
      } catch (caught) {
        if (shouldUseLocalFallback(caught)) {
          resolveLocal();
          return;
        }
        const normalized =
          caught instanceof AIClientError
            ? { code: caught.code, message: caught.message }
            : { code: "UNKNOWN", message: caught instanceof Error ? caught.message : "Error desconocido." };
        setError(normalized);
        setStatus("error");
      }
    },
    [districts, endpoint, fetchImpl],
  );

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<DiagnosisRequestDetail>).detail;
      const id = Number(detail?.district_id);
      if (!Number.isInteger(id) || id <= 0) return;
      const requestedYear = Number(detail?.year);
      void run(id, Number.isInteger(requestedYear) && requestedYear > 0 ? requestedYear : null);
    };

    window.addEventListener(OPEN_DIAGNOSIS_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_DIAGNOSIS_EVENT, handleOpen);
  }, [run]);

  useEffect(() => {
    if (!autoLoad) return;
    if (targetId == null) return;
    void run(targetId, effectiveYear);
    // Solo al montar: los cambios posteriores se piden con el botón o el evento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  return (
    <section className="gq-diagnosis" aria-labelledby={titleId}>
      <div className="gq-section-heading">
        <p className="gq-eyebrow">Diagnóstico automático</p>
        <h2 id={titleId}>Lectura del distrito con evidencia</h2>
        <p>
          El diagnóstico solo explica hechos precalculados del dataset. No calcula índices, no detecta hotspots y
          no decide prioridades.
        </p>
      </div>

      <div className="gq-diagnosis-bar">
        <label className="gq-field">
          <span>Distrito</span>
          <select
            value={targetId ?? ""}
            onChange={(event) => {
              const id = Number(event.target.value);
              setTargetId(Number.isInteger(id) && id > 0 ? id : null);
              setResponse(null);
              setError(null);
              setStatus("idle");
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
        <button
          type="button"
          className="gq-button"
          onClick={() => void run(targetId, effectiveYear)}
          disabled={targetId == null || status === "loading"}
        >
          {status === "loading" ? "Analizando…" : status === "ready" ? "Actualizar diagnóstico" : "Ver diagnóstico automático"}
        </button>
      </div>

      {targetId == null ? (
        <div className="gq-empty">
          <strong>Selecciona un distrito</strong>
          <p>El diagnóstico necesita un distrito y, si existe, un año con datos.</p>
        </div>
      ) : null}

      {status === "loading" ? (
        <p className="gq-chat-loading" role="status">
          <span className="gq-spinner" aria-hidden="true" /> Generando el diagnóstico con el contexto del distrito…
        </p>
      ) : null}

      {status === "error" && error ? (
        <div className="gq-state gq-state--error" role="alert">
          <strong>No se pudo generar el diagnóstico ({error.code}).</strong>
          <p>{error.message}</p>
          <div className="gq-chat-actions">
            <button type="button" className="gq-button" onClick={() => void run(targetId, effectiveYear)}>
              Reintentar
            </button>
            <button
              type="button"
              className="gq-button gq-button--ghost"
              onClick={() => void run(targetId, effectiveYear, { forceLocal: true })}
            >
              Usar respuesta por reglas
            </button>
          </div>
        </div>
      ) : null}

      {status === "ready" && response ? (
        <div className="gq-diagnosis-result">
          <header className="gq-diagnosis-meta">
            <p>
              <strong>{selected?.name ?? `Distrito ${response.district_id ?? ""}`}</strong>
              {response.year != null ? ` · ${response.year}` : ""}
            </p>
            <p className="gq-diagnosis-badges">
              {response.fallback_used || local ? (
                <span className="gq-badge gq-tone--intermedia">Respuesta por reglas</span>
              ) : null}
              <span className={`gq-data-badge gq-data-badge--${response.data_status}`}>
                {response.data_status === "real"
                  ? "Datos reales"
                  : response.data_status === "illustrative"
                    ? "Datos ilustrativos"
                    : "Datos insuficientes"}
              </span>
              <span className="gq-chat-model">
                {formatDate(response.generated_at)}
                {response.model ? ` · ${response.model.provider}/${response.model.name}` : ""}
              </span>
            </p>
          </header>

          <p className="gq-diagnosis-answer">{response.answer}</p>

          {response.insights.length === 0 ? (
            <div className="gq-empty gq-empty--compact">
              <strong>Sin hallazgos para este distrito</strong>
              <p>El contexto no contiene observaciones suficientes para tarjetas de diagnóstico.</p>
            </div>
          ) : (
            <ul className="gq-diagnosis-grid">
              {response.insights.map((insight) => {
                const severity = severityLabel(insight.severity);
                return (
                  <li key={insight.id} className={`gq-diagnosis-card gq-severity--${insight.severity}`}>
                    <div className="gq-diagnosis-card-head">
                      <span className="gq-severity-chip">
                        <span aria-hidden="true">{severity.icon}</span> {severity.label}
                      </span>
                      <span className="gq-chat-kind">{kindLabel(insight.kind)}</span>
                    </div>
                    <h3>{insight.title}</h3>
                    <p>{insight.body}</p>
                    {insight.evidence.length > 0 ? (
                      <dl className="gq-diagnosis-evidence">
                        {insight.evidence.map((evidence, index) => (
                          <div key={`${evidence.field}-${index}`}>
                            <dt>
                              {evidence.field}
                              {evidence.year != null ? ` · ${evidence.year}` : ""}
                            </dt>
                            <dd>
                              {evidenceValue(evidence.value)}
                              {evidence.unit ? ` ${evidence.unit}` : ""}
                              <span className="gq-row-unit">Fuente: {evidence.source_ref}</span>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="gq-caveat">Esta tarjeta no declara evidencia numérica.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {response.citations.length > 0 ? (
            <div className="gq-diagnosis-citations">
              <h3>Citas</h3>
              <ul>
                {response.citations.map((citation, index) => (
                  <li key={`${citation.source_ref}-${index}`}>
                    <strong>{citation.label}</strong>
                    <span>
                      {citation.field ? ` · ${citation.field}` : ""}
                      {citation.year != null ? ` · ${citation.year}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="gq-caveat">{response.disclaimer}</p>
          <p className="gq-source-note">Fuentes recuperadas: {collectSources(response).join(", ") || NOT_AVAILABLE}.</p>
        </div>
      ) : null}
    </section>
  );
}
