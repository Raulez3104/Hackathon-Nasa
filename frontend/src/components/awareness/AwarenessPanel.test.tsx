import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwarenessPanel } from "./AwarenessPanel";
import { makeDistrict, makeSeries } from "../../test/fixtures";

const LOSS = makeDistrict({
  district_id: 1,
  name: "Distrito 1",
  series: makeSeries({ ndvi: (year) => 0.5 - (year - 2015) * 0.02 }),
});

const GAIN = makeDistrict({
  district_id: 2,
  name: "Distrito 2",
  series: makeSeries({ ndvi: (year) => 0.2 + (year - 2015) * 0.02 }),
});

const INSUFFICIENT = makeDistrict({
  district_id: 3,
  name: "Distrito 3",
  data_status: "insufficient",
  series: makeSeries({ ndvi: (year) => (year === 2025 ? 0.33 : null) }),
});

const DISTRICTS = [LOSS, GAIN, INSUFFICIENT];

describe("AwarenessPanel", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("muestra la lectura del distrito, estrategias, mensajes, fuentes y advertencias", () => {
    render(<AwarenessPanel districts={DISTRICTS} status="ready" year={2025} />);

    expect(screen.getByRole("heading", { name: /pérdida verde, estrategias y mensajes ciudadanos/i })).toBeInTheDocument();
    expect(screen.getByText(/pérdida de vigor vegetal \(NDVI\) entre 2015 y 2025/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /estrategias basadas en datos/i })).toBeInTheDocument();
    expect(screen.getByText(/monitorear la pérdida de vigor vegetal/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^mensajes ciudadanos$/i })).toBeInTheDocument();
    expect(screen.getByText(/no mide directamente hectáreas deforestadas/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /fuentes citadas/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Mock ilustrativo de desarrollo/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /advertencia metodológica/i })).toBeInTheDocument();
    expect(screen.getByText(/no demuestran causas/i)).toBeInTheDocument();
    expect(screen.queryByText(/recomendación vinculante/i)).not.toBeInTheDocument();
  });

  it("etiqueta los datos ilustrativos y declara el periodo", () => {
    render(<AwarenessPanel districts={DISTRICTS} status="ready" year={2025} />);

    expect(screen.getAllByText("Datos ilustrativos").length).toBeGreaterThan(0);
    expect(screen.getByText(/periodo evaluado: 2015–2025/i)).toBeInTheDocument();
    expect(screen.getByText(/año consultado: 2025/i)).toBeInTheDocument();
  });

  it("muestra No disponible para distritos sin serie suficiente", () => {
    render(<AwarenessPanel districts={DISTRICTS} status="ready" year={2025} />);

    const row = screen.getByRole("row", { name: /Distrito 3/i });
    expect(within(row).getByText("Serie insuficiente")).toBeInTheDocument();
    expect(within(row).getAllByText("No disponible").length).toBeGreaterThanOrEqual(2);
    expect(within(row).getByText("Datos insuficientes")).toBeInTheDocument();
  });

  it("ordena la tabla por cambio de cobertura verde e incluye a los tres distritos", () => {
    render(<AwarenessPanel districts={DISTRICTS} status="ready" year={2025} />);

    const table = screen.getByRole("table", { name: /cambio de NDVI por distrito/i });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("rowheader")[0].textContent)).toEqual([
      "Distrito 1",
      "Distrito 2",
      "Distrito 3",
    ]);
    expect(within(rows[0]).getByText(/40,0 %/)).toBeInTheDocument();
  });

  it("cambia de distrito desde el selector y actualiza la URL", async () => {
    const user = userEvent.setup();
    render(<AwarenessPanel districts={DISTRICTS} status="ready" year={2025} />);

    await user.selectOptions(screen.getByRole("combobox", { name: /^distrito$/i }), "2");

    const params = new URLSearchParams(window.location.search);
    expect(params.get("district")).toBe("2");
    expect(params.get("panel")).toBe("awareness");
    expect(screen.getByText(/ganancia de vigor vegetal \(NDVI\) entre 2015 y 2025/i)).toBeInTheDocument();
  });

  it("respeta el distrito indicado en la URL", () => {
    window.history.replaceState({}, "", "/?district=2&panel=awareness");
    render(<AwarenessPanel districts={DISTRICTS} status="ready" year={2025} />);

    expect(screen.getByRole("combobox", { name: /^distrito$/i })).toHaveValue("2");
    expect(screen.getByText(/^Distrito 2: ganancia de vigor vegetal/i)).toBeInTheDocument();
  });

  it("muestra carga, error y reintento", async () => {
    const onRetry = vi.fn();
    const view = render(<AwarenessPanel districts={DISTRICTS} status="loading" year={2025} />);
    expect(screen.getByRole("status")).toHaveTextContent(/cargando datos/i);
    view.unmount();

    render(<AwarenessPanel districts={DISTRICTS} status="error" error="Fallo simulado" year={2025} onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Fallo simulado");
    await userEvent.setup().click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("muestra un estado vacío si no hay distritos", () => {
    render(<AwarenessPanel districts={[]} status="ready" year={2025} />);
    expect(screen.getByText(/sin distritos disponibles/i)).toBeInTheDocument();
  });
});
