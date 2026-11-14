import { describe, expect, it } from "vitest";
import { buildGamcVisibility, findGamcLayer, GAMC_LAYERS } from "./catalog";

describe("catálogo WMS del GAMC", () => {
  it("incluye las siete capas del proyecto con identificadores únicos", () => {
    expect(GAMC_LAYERS).toHaveLength(7);
    expect(new Set(GAMC_LAYERS.map((layer) => layer.id)).size).toBe(7);
    for (const layer of GAMC_LAYERS) {
      expect(layer.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(layer.name.length).toBeGreaterThan(0);
      expect(layer.supportsFeatureInfo).toBe(true);
    }
  });

  it("resuelve capas por identificador", () => {
    expect(findGamcLayer("97a589fe-595e-45dd-91d4-38524877f1ed")?.name).toBe("Áreas de Equipamiento");
    expect(findGamcLayer("00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });

  it("construye visibilidad inicial desactivada salvo las capas indicadas", () => {
    const visibility = buildGamcVisibility(["7eb13092-bf0e-493b-aae6-03c43eedda2c"]);
    expect(Object.keys(visibility)).toHaveLength(7);
    expect(visibility["7eb13092-bf0e-493b-aae6-03c43eedda2c"]).toBe(true);
    expect(visibility["47360ddc-e35f-4ece-a995-59e90eb79cc6"]).toBe(false);
  });
});
