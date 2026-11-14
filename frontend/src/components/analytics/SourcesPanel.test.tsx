import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SourcesPanel } from "./SourcesPanel";
import { SOURCE_CATALOG } from "./source-catalog";

describe("SourcesPanel", () => {
  it("muestra el catálogo con licencia, transformaciones y limitaciones", () => {
    render(<SourcesPanel />);

    expect(screen.getByRole("heading", { name: /catálogo de fuentes/i })).toBeInTheDocument();
    expect(screen.getByText("5 reales")).toBeInTheDocument();
    expect(screen.getByText("1 ilustrativas")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /MODIS MOD13Q1 \(NDVI\), colección 6.1/i })).toBeInTheDocument();
    expect(screen.getAllByText("Máscara de calidad QA").length).toBe(2);
    expect(screen.getByText("Resolución espacial de 250 m")).toBeInTheDocument();
    expect(screen.getAllByText(/datos abiertos nasa/i).length).toBe(2);

    const link = screen.getByRole("link", { name: /MODIS_061_MOD13Q1/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("MODIS_061_MOD13Q1"));
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
  });

  it("distingue la fuente ilustrativa con texto e ícono", () => {
    render(<SourcesPanel />);

    const mockCard = screen.getByRole("heading", { name: "mock_distritos.json" }).closest("li");
    expect(mockCard).not.toBeNull();
    expect(within(mockCard as HTMLElement).getByText(/dato ilustrativo/i)).toBeInTheDocument();
    expect(within(mockCard as HTMLElement).getByText(/no representa mediciones oficiales/i)).toBeInTheDocument();
    expect(within(mockCard as HTMLElement).getByText(/no usar para conclusiones/i)).toBeInTheDocument();
  });

  it("filtra por tipo de fuente y conserva las etiquetas", async () => {
    const user = userEvent.setup();
    render(<SourcesPanel />);

    await user.selectOptions(screen.getByRole("combobox", { name: /tipo de fuente/i }), "illustrative");

    expect(screen.getByRole("heading", { name: "mock_distritos.json" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /MODIS MOD13Q1/i })).not.toBeInTheDocument();
    expect(screen.getByText(/1 de 6 fuentes visibles/i)).toBeInTheDocument();
  });

  it("muestra un estado vacío si no hay fuentes", () => {
    render(<SourcesPanel sources={[]} />);
    expect(screen.getByText(/sin fuentes para este filtro/i)).toBeInTheDocument();
  });

  it("acepta un catálogo publicado y lo cuenta", () => {
    render(<SourcesPanel sources={[SOURCE_CATALOG[5]]} />);
    expect(screen.getByText("0 reales")).toBeInTheDocument();
    expect(screen.getByText("1 ilustrativas")).toBeInTheDocument();
  });

  it("muestra carga, error y reintento", async () => {
    const onRetry = vi.fn();
    const view = render(<SourcesPanel status="loading" />);
    expect(screen.getByRole("status")).toHaveTextContent(/cargando el catálogo/i);
    view.unmount();

    render(<SourcesPanel status="error" error="Fallo de fuentes" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Fallo de fuentes");
    await userEvent.setup().click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
