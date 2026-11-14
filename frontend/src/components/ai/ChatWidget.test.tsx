import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIResponse } from "../../../../shared/types/geoqocha";
import { ChatWidget } from "./ChatWidget";
import { MAX_QUESTION_LENGTH } from "./ai-client";
import { TEST_DISTRICTS } from "../../test/fixtures";

function makeResponse(overrides: Partial<AIResponse> = {}): AIResponse {
  return {
    request_id: "req_test",
    mode: "chat",
    district_id: 1,
    year: 2025,
    answer: "El Distrito 1 presenta una condición intermedia según los datos citados.",
    insights: [
      {
        id: "insight_01",
        kind: "observation",
        title: "Vegetación estable",
        body: "La pendiente de NDVI es cercana a cero en la serie disponible.",
        severity: "info",
        evidence: [
          { field: "ndvi_mean", year: 2025, value: 0.43, unit: "índice", source_ref: "mock" },
        ],
      },
    ],
    citations: [
      { source_ref: "mock", label: "Mock ilustrativo de desarrollo", field: "ndvi_mean", year: 2025 },
    ],
    disclaimer:
      "Respuesta generada a partir de datos precalculados. No es una evaluación oficial del GAMC ni una priorización de inversión. No implica causalidad.",
    data_status: "illustrative",
    model: { provider: "gemini", name: "modelo-configurado", prompt_version: "0.1.0" },
    generated_at: "2026-11-13T12:00:00Z",
    fallback_used: false,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderWidget(fetchImpl: typeof fetch = vi.fn(async () => jsonResponse(makeResponse()))) {
  return render(<ChatWidget districts={TEST_DISTRICTS} year={2025} fetchImpl={fetchImpl} defaultOpen />);
}

describe("ChatWidget", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("abre el copiloto desde el botón flotante y lo refleja en la URL", async () => {
    const user = userEvent.setup();
    render(<ChatWidget districts={TEST_DISTRICTS} year={2025} />);

    const launcher = screen.getByRole("button", { name: /abrir copiloto de ia/i });
    await user.click(launcher);

    expect(screen.getByRole("dialog", { name: /preguntas sobre los datos/i })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("panel")).toBe("chat");
  });

  it("envía la pregunta al endpoint del contrato y muestra respuesta, citas y advertencia", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async () => jsonResponse(makeResponse()));
    renderWidget(fetchImpl as unknown as typeof fetch);

    await user.type(screen.getByRole("textbox", { name: /pregunta/i }), "¿Cómo está la vegetación?");
    await user.click(screen.getByRole("button", { name: /^enviar$/i }));

    expect(await screen.findByText(/condición intermedia según los datos citados/i)).toBeInTheDocument();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/ai-analyst");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      mode: "chat",
      question: "¿Cómo está la vegetación?",
      locale: "es",
      district_id: 1,
      year: 2025,
    });

    expect(screen.getByText(/vegetación estable/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock ilustrativo de desarrollo/i)).toBeInTheDocument();
    expect(screen.getByText(/no implica causalidad/i)).toBeInTheDocument();
    expect(screen.queryByText(/respuesta por reglas/i)).not.toBeInTheDocument();
    expect(screen.getByText(/gemini · modelo-configurado/i)).toBeInTheDocument();
  });

  it("muestra el estado de carga mientras espera la respuesta", async () => {
    const user = userEvent.setup();
    let resolveFetch: ((value: Response) => void) | null = null;
    const fetchImpl = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    renderWidget(fetchImpl as unknown as typeof fetch);

    await user.type(screen.getByRole("textbox", { name: /pregunta/i }), "¿Y la temperatura?");
    await user.click(screen.getByRole("button", { name: /^enviar$/i }));

    expect(await screen.findByText(/consultando los datos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviando/i })).toBeDisabled();

    (resolveFetch as ((value: Response) => void) | null)?.(jsonResponse(makeResponse()));
    expect(await screen.findByText(/condición intermedia según los datos citados/i)).toBeInTheDocument();
  });

  it("muestra el error con reintento y vuelve a consultar", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: "UPSTREAM_ERROR", message: "El proveedor falló." } }, 502),
      )
      .mockResolvedValueOnce(jsonResponse(makeResponse({ answer: "Segundo intento correcto." })));
    renderWidget(fetchImpl as unknown as typeof fetch);

    await user.type(screen.getByRole("textbox", { name: /pregunta/i }), "¿Qué pasa?");
    await user.click(screen.getByRole("button", { name: /^enviar$/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/UPSTREAM_ERROR/);
    expect(within(alert).getByText("El proveedor falló.")).toBeInTheDocument();

    await user.click(within(alert).getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByText("Segundo intento correcto.")).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("usa la respuesta por reglas local cuando no hay proveedor configurado", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: { code: "AI_NOT_CONFIGURED", message: "Sin proveedor configurado." } }, 503),
    );
    renderWidget(fetchImpl as unknown as typeof fetch);

    await user.type(screen.getByRole("textbox", { name: /pregunta/i }), "¿Cómo está el distrito?");
    await user.click(screen.getByRole("button", { name: /^enviar$/i }));

    expect(await screen.findByText(/Distrito 1, 2025/i)).toBeInTheDocument();
    expect(screen.getAllByText(/respuesta por reglas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mock ilustrativo de desarrollo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No implica causalidad/i).length).toBeGreaterThan(0);
  });

  it("usa la respuesta local si falla la red y permite pedirla manualmente", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    renderWidget(fetchImpl as unknown as typeof fetch);

    await user.type(screen.getByRole("textbox", { name: /pregunta/i }), "¿Hay datos territoriales?");
    await user.click(screen.getByRole("button", { name: /^enviar$/i }));

    expect(await screen.findByText(/componente territorial/i)).toBeInTheDocument();
    expect(screen.getAllByText(/respuesta por reglas/i).length).toBeGreaterThan(0);
  });

  it("permite pedir la respuesta local desde el error sin proveedor", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: { code: "UPSTREAM_TIMEOUT", message: "Tiempo agotado." } }, 504),
    );
    renderWidget(fetchImpl as unknown as typeof fetch);

    await user.type(screen.getByRole("textbox", { name: /pregunta/i }), "¿Y el ICVSA?");
    await user.click(screen.getByRole("button", { name: /^enviar$/i }));

    const alert = await screen.findByRole("alert");
    await user.click(within(alert).getByRole("button", { name: /usar respuesta por reglas/i }));

    expect(await screen.findAllByText(/ICVSA: 64 de 100/i)).not.toHaveLength(0);
    expect(screen.getAllByText(/respuesta por reglas/i).length).toBeGreaterThan(0);
  });

  it("mantiene el historial y envía preguntas sugeridas", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async () => jsonResponse(makeResponse()));
    renderWidget(fetchImpl as unknown as typeof fetch);

    await user.click(screen.getByRole("button", { name: /¿Cómo está la vegetación en este distrito\?/i }));
    expect(await screen.findByText(/condición intermedia según los datos citados/i)).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /pregunta/i }), "Segunda pregunta");
    await user.click(screen.getByRole("button", { name: /^enviar$/i }));

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Segunda pregunta")).toBeInTheDocument();
    expect(screen.getAllByText(/condición intermedia según los datos citados/i).length).toBe(2);
    expect(screen.queryByRole("button", { name: /¿Cómo está la vegetación en este distrito\?/i })).not.toBeInTheDocument();
  });

  it("limita la pregunta a 500 caracteres y deshabilita el envío vacío", async () => {
    renderWidget();

    const input = screen.getByRole("textbox", { name: /pregunta/i }) as HTMLTextAreaElement;
    expect(input).toHaveAttribute("maxLength", String(MAX_QUESTION_LENGTH));
    expect(screen.getByRole("button", { name: /^enviar$/i })).toBeDisabled();
    expect(screen.getByText(new RegExp(`0/${MAX_QUESTION_LENGTH}`))).toBeInTheDocument();
  });

  it("cierra el copiloto con el botón y limpia el panel de la URL", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/?panel=chat&district=1");
    render(<ChatWidget districts={TEST_DISTRICTS} year={2025} />);

    await user.click(screen.getByRole("button", { name: /cerrar copiloto de ia/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(new URLSearchParams(window.location.search).get("panel")).toBeNull();
  });
});
