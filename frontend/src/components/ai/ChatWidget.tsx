import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { AIRequest, AIResponse, DistrictData } from "../../../../shared/types/geoqocha";
import { NOT_AVAILABLE } from "../analytics/format";
import { districtById } from "../analytics/stats";
import { useFocusTrap } from "../analytics/use-focus-trap";
import { useUrlState, writeUrlPatch } from "../analytics/use-url-state";
import { AIClientError, MAX_QUESTION_LENGTH, postAIRequest, shouldUseLocalFallback } from "./ai-client";
import { CHAT_SUGGESTIONS, buildLocalResponse } from "./local-fallback";
import "./chat.css";

export interface ChatWidgetProps {
  districts: DistrictData[];
  year: number | null;
  endpoint?: string;
  fetchImpl?: typeof fetch;
  /** Permite incrustar el widget abierto en pruebas o en una vista dedicada. */
  defaultOpen?: boolean;
}

interface ChatTurn {
  id: string;
  question: string;
  response: AIResponse | null;
  error: { code: string; message: string } | null;
  local: boolean;
}

let turnCounter = 0;
function nextTurnId(): string {
  turnCounter += 1;
  return `turn_${turnCounter}`;
}

function errorLabel(error: unknown): { code: string; message: string } {
  if (error instanceof AIClientError) return { code: error.code, message: error.message };
  return { code: "UNKNOWN", message: error instanceof Error ? error.message : "Error desconocido." };
}

/** La IA solo narra; la UI nunca calcula índices a partir de la respuesta. */
export function ChatWidget({ districts, year, endpoint, fetchImpl, defaultOpen = false }: ChatWidgetProps) {
  const { state, setPanel } = useUrlState();
  const open = defaultOpen || state.panel === "chat";
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [pending, setPending] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const titleId = useId();

  const selected = districtById(districts, state.districtId) ?? districts[0] ?? null;
  const effectiveYear = year ?? selected?.latest_year ?? null;

  const openPanel = useCallback(() => setPanel("chat"), [setPanel]);
  const closePanel = useCallback(() => setPanel(null), [setPanel]);

  useFocusTrap(panelRef, open && !defaultOpen, closePanel);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = useCallback(
    async (question: string, options: { forceLocal?: boolean } = {}) => {
      const trimmed = question.trim();
      if (trimmed.length === 0 || pending) return;

      const turn: ChatTurn = {
        id: nextTurnId(),
        question: trimmed,
        response: null,
        error: null,
        local: false,
      };
      setTurns((current) => [...current, turn]);
      setInput("");
      setPending(true);

      const request: AIRequest = {
        mode: "chat",
        question: trimmed,
        locale: "es",
        ...(selected ? { district_id: selected.district_id } : {}),
        ...(effectiveYear != null ? { year: effectiveYear } : {}),
      };

      const resolveLocal = () => {
        const local = buildLocalResponse(request, selected);
        setTurns((current) =>
          current.map((item) => (item.id === turn.id ? { ...item, response: local, local: true, error: null } : item)),
        );
      };

      if (options.forceLocal) {
        resolveLocal();
        setPending(false);
        return;
      }

      try {
        const response = await postAIRequest(request, { endpoint, fetchImpl });
        setTurns((current) => current.map((item) => (item.id === turn.id ? { ...item, response } : item)));
      } catch (error) {
        if (shouldUseLocalFallback(error)) {
          resolveLocal();
        } else {
          setTurns((current) =>
            current.map((item) => (item.id === turn.id ? { ...item, error: errorLabel(error) } : item)),
          );
        }
      } finally {
        setPending(false);
      }
    },
    [effectiveYear, endpoint, fetchImpl, pending, selected],
  );

  const retry = useCallback((turn: ChatTurn) => {
    setTurns((current) => current.filter((item) => item.id !== turn.id));
    void submit(turn.question);
  }, [submit]);

  const useLocal = useCallback((turn: ChatTurn) => {
    setTurns((current) => current.filter((item) => item.id !== turn.id));
    void submit(turn.question, { forceLocal: true });
  }, [submit]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(input);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit(input);
    }
  };

  if (!open) {
    return (
      <button type="button" className="gq-chat-launcher" onClick={openPanel} aria-label="Abrir copiloto de IA">
        <span aria-hidden="true">✦</span> Copiloto
      </button>
    );
  }

  return (
    <div className="gq-chat" ref={panelRef} role="dialog" aria-modal="false" aria-labelledby={titleId}>
        <header className="gq-chat-header">
          <div>
            <p className="gq-eyebrow">Copiloto GeoQocha</p>
            <h2 id={titleId}>Preguntas sobre los datos</h2>
            <p className="gq-chat-context">
              {selected ? selected.name : "Sin distrito"} · {effectiveYear ?? NOT_AVAILABLE}
            </p>
          </div>
          <button type="button" className="gq-icon-button" onClick={closePanel} aria-label="Cerrar copiloto de IA">
            ×
          </button>
        </header>

        <div className="gq-chat-context-row">
          <label className="gq-field">
            <span>Distrito</span>
            <select
              value={selected?.district_id ?? ""}
              onChange={(event) => {
                const id = Number(event.target.value);
                if (Number.isInteger(id) && id > 0) writeUrlPatch({ districtId: id, panel: "chat" });
              }}
            >
              <option value="">Sin distrito</option>
              {districts.map((district) => (
                <option key={district.district_id} value={district.district_id}>
                  {district.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="gq-chat-log" role="log">
          {turns.length === 0 ? (
            <div className="gq-chat-empty">
              <p>
                Pregunta por el ICVSA, el NDVI, la temperatura superficial o los datos territoriales. Las respuestas
                solo explican hechos precalculados y citan su fuente.
              </p>
              <p className="gq-caveat">
                El copiloto no calcula índices ni prioriza inversiones, y no guarda la conversación.
              </p>
            </div>
          ) : null}

          {turns.map((turn) => (
            <article className="gq-chat-turn" key={turn.id}>
              <p className="gq-chat-question">
                <span className="gq-chat-role">Tú</span>
                {turn.question}
              </p>

              {turn.response ? (
                <div className="gq-chat-answer">
                  <p className="gq-chat-role">Copiloto</p>
                  <p>{turn.response.answer}</p>

                  {turn.response.insights.length > 0 ? (
                    <ul className="gq-chat-insights">
                      {turn.response.insights.map((insight) => (
                        <li key={insight.id} className={`gq-chat-insight gq-severity--${insight.severity}`}>
                          <p>
                            <strong>{insight.title}</strong>
                            <span className="gq-chat-kind">{insight.kind}</span>
                          </p>
                          <p>{insight.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {turn.response.citations.length > 0 ? (
                    <ul className="gq-chat-citations" aria-label="Citas de la respuesta">
                      {turn.response.citations.map((citation, index) => (
                        <li key={`${citation.source_ref}-${index}`}>
                          {citation.label}
                          {citation.field ? ` · ${citation.field}` : ""}
                          {citation.year != null ? ` · ${citation.year}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <p className="gq-caveat">{turn.response.disclaimer}</p>

                  <p className="gq-chat-badges">
                    {turn.response.fallback_used || turn.local ? (
                      <span className="gq-badge gq-tone--intermedia">Respuesta por reglas</span>
                    ) : null}
                    <span className={`gq-data-badge gq-data-badge--${turn.response.data_status}`}>
                      {turn.response.data_status === "real"
                        ? "Datos reales"
                        : turn.response.data_status === "illustrative"
                          ? "Datos ilustrativos"
                          : "Datos insuficientes"}
                    </span>
                    {turn.response.model ? (
                      <span className="gq-chat-model">
                        {turn.response.model.provider} · {turn.response.model.name}
                      </span>
                    ) : null}
                  </p>
                </div>
              ) : turn.error ? (
                <div className="gq-chat-error" role="alert">
                  <p role="status">No se pudo obtener la respuesta ({turn.error.code}).</p>
                  <p className="gq-caveat">{turn.error.message}</p>
                  <div className="gq-chat-actions">
                    <button type="button" className="gq-button" onClick={() => retry(turn)}>
                      Reintentar
                    </button>
                    <button type="button" className="gq-button gq-button--ghost" onClick={() => useLocal(turn)}>
                      Usar respuesta por reglas
                    </button>
                  </div>
                </div>
              ) : (
                <p className="gq-chat-loading" role="status">
                  <span className="gq-spinner" aria-hidden="true" /> Consultando los datos…
                </p>
              )}
            </article>
          ))}
        </div>

        {turns.length === 0 ? (
          <div className="gq-chat-suggestions">
            {CHAT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="gq-chip"
                onClick={() => void submit(suggestion)}
                disabled={pending}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <form className="gq-chat-form" onSubmit={handleSubmit}>
          <label className="gq-chat-input-label" htmlFor={`${titleId}-input`}>
            Pregunta (máximo {MAX_QUESTION_LENGTH} caracteres)
          </label>
          <textarea
            id={`${titleId}-input`}
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, MAX_QUESTION_LENGTH))}
            onKeyDown={handleKeyDown}
            rows={2}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="¿Cómo está la vegetación en este distrito?"
          />
          <div className="gq-chat-form-footer">
            <span className="gq-caveat">
              {input.length}/{MAX_QUESTION_LENGTH} · No incluyas datos personales.
            </span>
            <button type="submit" className="gq-button" disabled={pending || input.trim().length === 0}>
              {pending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </form>
      </div>
  );
}
