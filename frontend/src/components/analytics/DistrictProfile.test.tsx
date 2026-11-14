import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DistrictProfile } from "./DistrictProfile";
import { TEST_DISTRICTS } from "../../test/fixtures";

describe("DistrictProfile", () => {
  it("muestra población, brechas, salud/educación y calidad del dato", () => {
    render(<DistrictProfile district={TEST_DISTRICTS[1]} districts={TEST_DISTRICTS} year={2025} />);

    expect(screen.getByRole("heading", { name: /población y territorio/i })).toBeInTheDocument();
    expect(screen.getByText("48.210 hab.")).toBeInTheDocument();
    expect(screen.getAllByText("2024").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: /brechas frente al promedio municipal/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /salud, educación y áreas verdes/i })).toBeInTheDocument();
    expect(screen.getByText(/calidad completa/i)).toBeInTheDocument();
    expect(screen.getByText(/área verde por debajo del umbral/i)).toBeInTheDocument();
  });

  it("muestra No disponible para un valor null y calcula el promedio con n", () => {
    render(<DistrictProfile district={TEST_DISTRICTS[1]} districts={TEST_DISTRICTS} year={2025} />);

    const ndviRow = screen.getByRole("row", { name: /NDVI medio/i });
    expect(within(ndviRow).getAllByText(/no disponible/i).length).toBeGreaterThanOrEqual(2);
    expect(within(ndviRow).getByText("n = 2")).toBeInTheDocument();

    const icvsaRow = screen.getByRole("row", { name: /^ICVSA/i });
    expect(within(icvsaRow).getByText("38")).toBeInTheDocument();
    expect(within(icvsaRow).getByText("n = 3")).toBeInTheDocument();
  });

  it("declara el año de referencia territorial y los límites metodológicos", () => {
    render(<DistrictProfile district={TEST_DISTRICTS[0]} districts={TEST_DISTRICTS} year={2025} />);

    expect(screen.getByText(/equipamiento y movilidad no se interpolan/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no implica causalidad|no es una causa/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/LST: temperatura superficial \(no del aire\)/i)).toBeInTheDocument();
  });
});
