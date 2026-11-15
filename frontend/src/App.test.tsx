import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DistrictData } from "../../shared/types/geoqocha";
import { App } from "./App";
import { loadDistricts } from "./lib/data-source";

vi.mock("./components/map/MapShell", () => ({
  MapShell: () => <div data-testid="map-shell" />,
}));

vi.mock("./components/analytics/AnalyticsWorkspace", () => ({
  AnalyticsWorkspace: () => <div data-testid="analytics-workspace" />,
}));

vi.mock("./lib/data-source", () => ({
  loadDistricts: vi.fn(() =>
    Promise.resolve({
      contract_version: "1.0.0",
      data_status: "illustrative",
      generated_at: "2026-11-13",
      districts: [],
    }),
  ),
}));

describe("App", () => {
  it("alterna entre la vista de mapa y la vista de analítica", async () => {
    const user = userEvent.setup();
    render(<App />);

    const mapButton = screen.getByRole("button", { name: "Mapa" });
    const analyticsButton = screen.getByRole("button", { name: "Analítica" });

    expect(mapButton).toHaveAttribute("aria-pressed", "true");
    expect(analyticsButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Año")).toBeInTheDocument();
    expect(screen.queryByTestId("analytics-workspace")).not.toBeInTheDocument();

    await user.click(analyticsButton);

    expect(analyticsButton).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByTestId("analytics-workspace")).toBeInTheDocument();
    expect(screen.queryByText("Año")).not.toBeInTheDocument();

    await user.click(mapButton);

    expect(mapButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("analytics-workspace")).not.toBeInTheDocument();
    expect(screen.getByText("Año")).toBeInTheDocument();
  });

  it("activa por defecto la capa municipal de equipamiento", async () => {
    render(<App />);

    const toggle = await screen.findByRole("checkbox", { name: /equipamiento/i });
    expect(toggle).toBeChecked();
  });

  it("con datos reales arranca en el último año con observación y en NDVI", async () => {
    vi.mocked(loadDistricts).mockResolvedValueOnce({
      contract_version: "0.1.0",
      data_status: "real",
      generated_at: "2026-11-15",
      districts: [
        {
          district_id: 1,
          name: "Distrito 1",
          series: [2019, 2020, 2021, 2022, 2023, 2024, 2025].map((year) => ({
            year,
            ndvi_mean: year <= 2022 ? 0.3 : null,
            lst_mean_celsius: year <= 2022 ? 29 : null,
            environmental_index: year <= 2022 ? 50 : null,
            socioenvironmental_index: null,
            index_without_territorial: year <= 2022 ? 50 : null,
            data_quality_flag: year <= 2022 ? "ok" : "insufficient",
          })),
        } as unknown as DistrictData,
      ],
    });

    render(<App />);

    expect(await screen.findByLabelText(/año/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/año/i)).toHaveValue("2022"));
    expect(screen.getByLabelText(/variable/i)).toHaveValue("ndvi");
  });
});
