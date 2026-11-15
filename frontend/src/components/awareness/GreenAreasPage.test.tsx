import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GreenAreasPage } from "./GreenAreasPage";

describe("GreenAreasPage", () => {
  it("muestra la vista de defensa verde y deja activo el enlace de navegación", () => {
    render(<GreenAreasPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Frenemos la deforestación de las áreas verdes de Cochabamba/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Áreas Verdes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Video: Cochabamba, parques de la ciudad")).toBeInTheDocument();
  });

  it("genera un registro de voluntariado sin enviar datos", async () => {
    const user = userEvent.setup();
    render(<GreenAreasPage />);

    await user.type(screen.getByLabelText("Nombre completo"), "Ana Quispe");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.selectOptions(screen.getByLabelText("Distrito"), "3");
    await user.selectOptions(screen.getByLabelText("Actividad de interés"), "Plantado de árboles nativos");
    await user.selectOptions(screen.getByLabelText("Disponibilidad"), "Fines de semana");
    await user.click(screen.getByLabelText(/Acepto que mis datos se usen/));
    await user.click(screen.getByRole("button", { name: /Enviar registro/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Registro de ejemplo generado");
    expect(screen.getByText("Ana Quispe")).toBeInTheDocument();
  });
});
