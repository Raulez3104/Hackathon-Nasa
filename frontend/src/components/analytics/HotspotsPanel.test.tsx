import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HotspotsPanel } from "./HotspotsPanel";
import type { HotspotCollection } from "./hotspot-rules";
import { makeDistrict, makeEquipment, makeSeries, TEST_DISTRICTS } from "../../test/fixtures";

const CALM = makeDistrict({
  district_id: 10,
  series: makeSeries({ ndvi: () => 0.5, icvsa: () => 78 }),
  trends: [],
  equipment: makeEquipment(10, {
    green_area_m2_per_capita: 9,
    mobility_access_index: 65,
    deficit_flags: [],
  }),
});

describe("HotspotsPanel", () => {
  it("muestra el ranking con reglas, contribuciones y advertencia", () => {
    render(<HotspotsPanel districts={TEST_DISTRICTS} status="ready" year={2025} />);

    expect(screen.getByRole("heading", { name: /hotspots con reglas explicadas/i })).toBeInTheDocument();
    expect(screen.getByText(/cálculo local de desarrollo/i)).toBeInTheDocument();
    expect(screen.getByText(/no es una evaluación oficial del gamc/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no implica causalidad/i).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { name: "Distrito 2" })).toBeInTheDocument();
    expect(screen.getByText(/prioridad media/i)).toBeInTheDocument();
    expect(screen.getByText("40 / 100")).toBeInTheDocument();
    expect(screen.getByText(/activa 2 reglas/i)).toBeInTheDocument();

    expect(screen.getByText("EQUIPMENT_DEFICIT")).toBeInTheDocument();
    expect(screen.getByText("ICVSA_LOW")).toBeInTheDocument();
    expect(screen.getByText("NDVI_NEGATIVE_TREND")).toBeInTheDocument();
    expect(screen.getAllByText(/activada/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/no activada/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Equipamiento: 20 pts")).toBeInTheDocument();
    expect(screen.getByText("ICVSA: 20 pts")).toBeInTheDocument();
    expect(screen.getByText("NDVI: 0 pts")).toBeInTheDocument();

    const table = screen.getByRole("table", { name: /reglas evaluadas para distrito 2/i });
    expect(within(table).getAllByText("20 pts").length).toBe(2);
    expect(within(table).getByText("4 m²/hab.")).toBeInTheDocument();
  });

  it("filtra por prioridad mínima y muestra todos los distritos con prioridad baja", async () => {
    const user = userEvent.setup();
    render(<HotspotsPanel districts={TEST_DISTRICTS} status="ready" year={2025} />);

    expect(screen.queryByRole("heading", { name: "Distrito 1" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: /prioridad mínima/i }), "low");

    expect(screen.getByRole("heading", { name: "Distrito 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Distrito 2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Distrito 3" })).toBeInTheDocument();
    expect(screen.getAllByText(/prioridad baja/i).length).toBe(2);
  });

  it("muestra un estado vacío cuando ningún distrito activa reglas", () => {
    render(<HotspotsPanel districts={[CALM]} status="ready" year={2025} />);

    expect(screen.getByText(/sin hotspots para esta prioridad/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("acepta un ranking ya calculado por el backend sin marcarlo como local", () => {
    const collection: HotspotCollection = {
      year: 2025,
      methodology_version: "0.1.0",
      disclaimer: "Clasificación indicativa basada en reglas explícitas.",
      hotspots: [
        {
          district_id: 5,
          district_name: "Distrito 5",
          year: 2025,
          priority_level: "high",
          score: 80,
          rules: [
            {
              rule_id: "ICE_CUSTOM",
              variable: "index",
              description: "Regla publicada por el backend.",
              observed_value: 12,
              threshold: 30,
              unit: "índice 1–100",
              triggered: true,
              contribution: 80,
            },
          ],
          contributions: [{ variable: "index", label: "ICVSA", points: 80, triggered: true }],
          explanation: "Regla publicada por el backend.",
          data_status: "real",
        },
      ],
      computed_locally: false,
      evaluated_districts: 15,
    };

    render(<HotspotsPanel districts={TEST_DISTRICTS} status="ready" year={2025} collection={collection} />);

    expect(screen.getByRole("heading", { name: "Distrito 5" })).toBeInTheDocument();
    expect(screen.queryByText(/cálculo local de desarrollo/i)).not.toBeInTheDocument();
    expect(screen.getByText(/distritos evaluados: 15/i)).toBeInTheDocument();
  });

  it("muestra carga, error y reintento", async () => {
    const onRetry = vi.fn();
    const view = render(<HotspotsPanel districts={TEST_DISTRICTS} status="loading" year={2025} />);
    expect(screen.getByRole("status")).toHaveTextContent(/cargando el ranking/i);
    view.unmount();

    render(
      <HotspotsPanel districts={TEST_DISTRICTS} status="error" error="Fallo simulado" year={2025} onRetry={onRetry} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Fallo simulado");
    await userEvent.setup().click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
