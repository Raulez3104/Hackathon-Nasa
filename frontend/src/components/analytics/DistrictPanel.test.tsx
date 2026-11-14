import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DistrictPanel } from "./DistrictPanel";
import { TEST_DISTRICTS } from "../../test/fixtures";

function renderPanel(options: { status?: "idle" | "loading" | "ready" | "error"; error?: string; onRetry?: () => void } = {}) {
  return render(
    <DistrictPanel
      districts={TEST_DISTRICTS}
      status={options.status ?? "ready"}
      error={options.error}
      year={2025}
      variant="drawer"
      onRetry={options.onRetry}
    />,
  );
}

describe("DistrictPanel", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?district=1&panel=district&year=2025");
  });

  it("abre el diálogo, mueve el foco y muestra la ficha del distrito", async () => {
    renderPanel();

    const dialog = screen.getByRole("dialog", { name: /distrito 1/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/condición intermedia/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/48\.210 hab\./)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cerrar panel distrital/i })).toHaveFocus();
    });
  });

  it("se cierra con Escape y limpia panel de la URL", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(new URLSearchParams(window.location.search).get("panel")).toBeNull();
    expect(new URLSearchParams(window.location.search).get("district")).toBe("1");
  });

  it("muestra el estado de carga y el error con reintento", async () => {
    const onRetry = vi.fn();
    const view = renderPanel({ status: "loading" });
    expect(screen.getByRole("status")).toHaveTextContent(/cargando datos/i);
    view.unmount();

    renderPanel({ status: "error", error: "Fallo de red simulado", onRetry });
    expect(screen.getByRole("alert")).toHaveTextContent("Fallo de red simulado");
    await userEvent.setup().click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("muestra el estado vacío cuando no hay distrito seleccionado", () => {
    window.history.replaceState({}, "", "/?panel=district");
    renderPanel();

    expect(screen.getByText(/selecciona un distrito/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /^distrito$/i })).toBeInTheDocument();
  });

  it("permite comparar dos distritos lado a lado desde la URL", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/?district=1&panel=district&districts=1,2&year=2025");
    renderPanel();

    await user.click(screen.getByRole("tab", { name: /comparar/i }));

    expect(screen.getByRole("tab", { name: /comparar/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("combobox", { name: /distrito a/i })).toHaveValue("1");
    expect(screen.getByRole("combobox", { name: /distrito b/i })).toHaveValue("2");

    const table = screen.getByRole("table");
    expect(within(table).getByText("ICVSA")).toBeInTheDocument();
    expect(within(table).getByText("64")).toBeInTheDocument();
    expect(within(table).getByText("38")).toBeInTheDocument();
  });

  it("pide completar la comparación si solo hay un distrito", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/?district=1&panel=district&districts=1&year=2025");
    renderPanel();

    await user.click(screen.getByRole("tab", { name: /comparar/i }));

    expect(screen.getByText(/faltan distritos por elegir/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
