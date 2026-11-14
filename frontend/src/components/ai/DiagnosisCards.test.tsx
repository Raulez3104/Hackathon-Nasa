import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIResponse } from "../../../../shared/types/geoqocha";
import { DiagnosisCards, OPEN_DIAGNOSIS_EVENT } from "./DiagnosisCards";
import { TEST_DISTRICTS } from "../../test/fixtures";

function makeDiagnosis(overrides: Partial<AIResponse> = {}): AIResponse {
  return {
    request_id: "req_diag",
    mode: "diagnosis",
    district_id: 1,
    year: 2025,
    answer: "El Distrito 1 combina un ICVSA intermedio con NDVI estable.",
    insights: [
      {
        id: "insight_01",
        kind: "observation",
        title: "Vigor vegetal estable",
        body: "La serie de NDVI no muestra un cambio relevante en el periodo.",
        severity: "info",
        evidence: [{ field: "ndvi_mean", year: 2025, value: 0.43, unit: "índice", source_ref: "mock" }],
      },
      {
        id: "insight_02",
        kind: "caveat",
        title: "Equipamiento fijo en 2024",
        body: "El componente territorial no se interpola a otros años.",
        severity: "warning",
        evidence: [
          { field: "territorial_reference_year", year: 2024, value: 2024, unit: "año", source_ref: "gamc_equipment" },
        ],
      },
    ],
    citations: [
      { source_ref: "mock", label: "Mock ilustrativo de desarrollo", field: "ndvi_mean", year: 2025 },
      { source_ref: "gamc_equipment", label: "GAMC, equipamiento y movilidad", field: "territorial_reference_year", year: 2024 },
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

describe("DiagnosisCards", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("pide seleccionar un distrito y deshabilita el botón", () => {
    render(<DiagnosisCards districts={TEST_DISTRICTS} year={2025} />);

    expect(screen.getByRole("heading", { name: /lectura del distrito con evidencia/i })).toBeInTheDocument();
    expect(screen.getByText(/selecciona un distrito/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ver diagnóstico automático/i })).toBeDisabled();
  });

  it("consume mode diagnosis y renderiza insights, severidad, evidencia y citas", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async () => jsonResponse(makeDiagnosis()));
    render(<DiagnosisCards districts={TEST_DISTRICTS} year={2025} districtId={1} fetchImpl={fetchImpl as unknown as typeof fetch} />);

    await user.click(screen.getByRole("button", { name: /ver diagnóstico automático/i }));

    expect(await screen.findByText(/combina un ICVSA intermedio/i)).toBeInTheDocument();

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/ai-analyst");
    expect(JSON.parse(String(init.body))).toEqual({
      mode: "diagnosis",
      district_id: 1,
      locale: "es",
      year: 2025,
    });

    expect(screen.getByRole("heading", { name: "Vigor vegetal estable" })).toBeInTheDocument();
    expect(screen.getByText("Informativo")).toBeInTheDocument();
    expect(screen.getByText("Advertencia")).toBeInTheDocument();
    expect(screen.getByText("Observación")).toBeInTheDocument();
    expect(screen.getByText("Advertencia metodológica")).toBeInTheDocument();
    expect(screen.getByText(/0,43 índice/)).toBeInTheDocument();
    expect(screen.getByText("ndvi_mean · 2025")).toBeInTheDocument();
    expect(screen.getByText(/Fuente: mock/i)).toBeInTheDocument();
    expect(screen.getByText("GAMC, equipamiento y movilidad")).toBeInTheDocument();
    expect(screen.getByText(/no implica causalidad/i)).toBeInTheDocument();
    expect(screen.queryByText(/respuesta por reglas/i)).not.toBeInTheDocument();
    expect(screen.getByText(/gemini\/modelo-configurado/i)).toBeInTheDocument();
  });

  it("se dispara con el evento de apertura del panel distrital", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(makeDiagnosis()));
    render(<DiagnosisCards districts={TEST_DISTRICTS} year={2025} fetchImpl={fetchImpl as unknown as typeof fetch} />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent(OPEN_DIAGNOSIS_EVENT, { detail: { district_id: 2, year: 2025 } }),
      );
    });

    expect(await screen.findByText(/combina un ICVSA intermedio/i)).toBeInTheDocument();
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ mode: "diagnosis", district_id: 2, year: 2025 });
    expect(screen.getByRole("combobox", { name: /distrito/i })).toHaveValue("2");
  });

  it("carga automáticamente cuando se pide en una vista dedicada", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(makeDiagnosis()));
    render(
      <DiagnosisCards
        districts={TEST_DISTRICTS}
        year={2025}
        districtId={1}
        autoLoad
        fetchImpl={fetchImpl as unknown as typeof fetch}
      />,
    );

    expect(await screen.findByText(/combina un ICVSA intermedio/i)).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("muestra el error, reintenta y permite la respuesta por reglas", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UPSTREAM_ERROR", message: "Proveedor caído." } }, 502))
      .mockResolvedValueOnce(jsonResponse(makeDiagnosis({ answer: "Diagnóstico recuperado." })));
    render(<DiagnosisCards districts={TEST_DISTRICTS} year={2025} districtId={1} fetchImpl={fetchImpl as unknown as typeof fetch} />);

    await user.click(screen.getByRole("button", { name: /ver diagnóstico automático/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/UPSTREAM_ERROR/);
    expect(within(alert).getByText("Proveedor caído.")).toBeInTheDocument();

    await user.click(within(alert).getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByText("Diagnóstico recuperado.")).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("no se rompe si la API falla y ofrece la respuesta local", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async () => new Response("texto plano", { status: 502 }));
    render(<DiagnosisCards districts={TEST_DISTRICTS} year={2025} districtId={1} fetchImpl={fetchImpl as unknown as typeof fetch} />);

    await user.click(screen.getByRole("button", { name: /ver diagnóstico automático/i }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/INVALID_RESPONSE/);

    await user.click(within(alert).getByRole("button", { name: /usar respuesta por reglas/i }));

    expect(await screen.findByRole("heading", { name: "Lectura del distrito" })).toBeInTheDocument();
    expect(screen.getAllByText(/respuesta por reglas/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Datos territoriales fijos" })).toBeInTheDocument();
  });

  it("usa el fallback local automático cuando no hay proveedor configurado", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: { code: "AI_NOT_CONFIGURED", message: "Sin clave." } }, 503),
    );
    render(<DiagnosisCards districts={TEST_DISTRICTS} year={2025} districtId={1} fetchImpl={fetchImpl as unknown as typeof fetch} />);

    await user.click(screen.getByRole("button", { name: /ver diagnóstico automático/i }));

    expect(await screen.findByText(/Distrito 1, 2025/i)).toBeInTheDocument();
    expect(screen.getAllByText(/respuesta por reglas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No implica causalidad/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/respuesta por reglas local/i)).toBeInTheDocument();
  });

  it("limpia el resultado al cambiar de distrito", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async () => jsonResponse(makeDiagnosis()));
    render(<DiagnosisCards districts={TEST_DISTRICTS} year={2025} districtId={1} fetchImpl={fetchImpl as unknown as typeof fetch} />);

    await user.click(screen.getByRole("button", { name: /ver diagnóstico automático/i }));
    await screen.findByText(/combina un ICVSA intermedio/i);

    await user.selectOptions(screen.getByRole("combobox", { name: /distrito/i }), "2");

    await waitFor(() => {
      expect(screen.queryByText(/combina un ICVSA intermedio/i)).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /ver diagnóstico automático/i })).toBeEnabled();
  });
});
