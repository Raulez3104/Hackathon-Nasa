import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

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
});
