import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MethodologyPanel } from "./MethodologyPanel";
import { TEST_DISTRICTS } from "../../test/fixtures";

describe("MethodologyPanel", () => {
  it("publica fórmula, pesos, escala y suma de pesos", () => {
    render(<MethodologyPanel districts={TEST_DISTRICTS} status="ready" year={2025} />);

    expect(screen.getByRole("heading", { name: /metodología del icvsa/i })).toBeInTheDocument();
    expect(screen.getByText(/0,35·S_ndvi/)).toBeInTheDocument();

    const weights = screen.getByRole("table", { name: /pesos del icvsa/i });
    expect(within(weights).getByText("Vegetación (NDVI)")).toBeInTheDocument();
    expect(within(weights).getByText("Temperatura superficial (LST)")).toBeInTheDocument();
    expect(within(weights).getByText("Suma de pesos")).toBeInTheDocument();
    expect(within(weights).getByText("1,00")).toBeInTheDocument();
    expect(within(weights).getByText("100 %")).toBeInTheDocument();
    expect(screen.getByText(/escala 1–100/i)).toBeInTheDocument();
  });

  it("declara la política temporal, el t_ref y la política de faltantes", () => {
    render(<MethodologyPanel districts={TEST_DISTRICTS} status="ready" year={2025} />);

    expect(screen.getByText("Año de referencia territorial (t_ref)")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText(/territorio fijo en el año de referencia/i)).toBeInTheDocument();
    expect(screen.getByText(/nunca imputar cero/i)).toBeInTheDocument();
    expect(screen.getByText(/min-max fijo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/index_without_territorial/i).length).toBeGreaterThan(0);

    const interpolation = screen.getByText("Interpolación permitida").closest("div");
    expect(interpolation).not.toBeNull();
    expect(within(interpolation as HTMLElement).getByText("No")).toBeInTheDocument();
  });

  it("lista la clasificación con texto e ícono", () => {
    render(<MethodologyPanel districts={TEST_DISTRICTS} status="ready" year={2025} />);

    expect(screen.getByText("Condición relativa favorable")).toBeInTheDocument();
    expect(screen.getByText("Condición intermedia")).toBeInTheDocument();
    expect(screen.getByText("Condición de atención")).toBeInTheDocument();
    expect(screen.getByText("70–100")).toBeInTheDocument();
    expect(screen.getByText("40–69")).toBeInTheDocument();
    expect(screen.getByText("1–39")).toBeInTheDocument();
  });

  it("resume la calidad del dato y muestra vacíos como No disponible", () => {
    render(<MethodologyPanel districts={TEST_DISTRICTS} status="ready" year={2025} />);

    expect(screen.getByRole("heading", { name: /calidad del dato en la interfaz/i })).toBeInTheDocument();
    expect(screen.getByText(/vacíos: ndvi 1, lst 0, icvsa 0/i)).toBeInTheDocument();

    const table = screen.getByRole("table", { name: /calidad y cobertura por distrito/i });
    const row = within(table).getByRole("row", { name: /Distrito 2/i });
    expect(within(row).getByText("No disponible")).toBeInTheDocument();
    expect(within(row).getByText("Calidad completa")).toBeInTheDocument();
  });

  it("mantiene la metodología completa sin dataset", () => {
    render(<MethodologyPanel status="ready" />);

    expect(screen.getByText(/sin dataset cargado/i)).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /calidad y cobertura/i })).not.toBeInTheDocument();
  });

  it("muestra carga, error y reintento", async () => {
    const onRetry = vi.fn();
    const view = render(<MethodologyPanel status="loading" />);
    expect(screen.getByRole("status")).toHaveTextContent(/cargando la metodología/i);
    view.unmount();

    render(<MethodologyPanel status="error" error="Fallo de metodología" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Fallo de metodología");
    await userEvent.setup().click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
