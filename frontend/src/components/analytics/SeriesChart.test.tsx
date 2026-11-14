import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SeriesChart } from "./SeriesChart";
import { TEST_DISTRICTS } from "../../test/fixtures";

describe("SeriesChart", () => {
  it("renderiza la serie NDVI con tabla accesible y huecos como No disponible", async () => {
    const user = userEvent.setup();
    render(<SeriesChart primary={TEST_DISTRICTS[0]} secondary={TEST_DISTRICTS[1]} year={2025} />);

    expect(screen.getByRole("img", { name: /serie de NDVI de Distrito 1 y Distrito 2, 2015 a 2025/i })).toBeInTheDocument();

    await user.click(screen.getByText(/ver tabla de datos accesible/i));
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Año" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Distrito 2" })).toBeInTheDocument();

    const row2025 = within(table).getByRole("row", { name: /2025/i });
    expect(within(row2025).getAllByText(/no disponible/i).length).toBeGreaterThanOrEqual(1);
    expect(within(row2025).getByText("0,430")).toBeInTheDocument();
  });

  it("cambia entre NDVI, LST e ICVSA", async () => {
    const user = userEvent.setup();
    render(<SeriesChart primary={TEST_DISTRICTS[0]} year={2025} />);

    await user.click(screen.getByRole("tab", { name: "LST" }));
    expect(screen.getByRole("img", { name: /serie de LST/i })).toBeInTheDocument();
    await user.click(screen.getByText(/ver tabla de datos accesible/i));
    expect(screen.getByText("30,5 °C")).toBeInTheDocument();
    expect(screen.getByText(/LST es temperatura superficial/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "ICVSA" }));
    expect(screen.getByRole("img", { name: /serie de ICVSA/i })).toBeInTheDocument();
    expect(screen.getAllByText("64").length).toBeGreaterThan(0);
    expect(screen.getByText(/no es una evaluación oficial/i)).toBeInTheDocument();
  });

  it("usa el teclado para navegar entre variables", async () => {
    const user = userEvent.setup();
    render(<SeriesChart primary={TEST_DISTRICTS[0]} year={2025} />);

    const ndviTab = screen.getByRole("tab", { name: "NDVI" });
    ndviTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "LST" })).toHaveAttribute("aria-selected", "true");
  });
});
