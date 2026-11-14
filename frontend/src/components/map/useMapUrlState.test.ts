import { describe, expect, it } from "vitest";
import { readMapUrlState } from "./useMapUrlState";

describe("estado URL del mapa", () => {
  it("lee selección, comparación, año, variable, vista y capas", () => {
    expect(readMapUrlState("?district=3&districts=3,9&year=2020&variable=lst&view=semaphore&layers=transport,lst"))
      .toEqual({
        districtId: 3,
        compareIds: [3, 9],
        year: 2020,
        variable: "lst",
        view: "semaphore",
        layers: ["transport", "lst"],
      });
  });

  it("descarta parámetros inválidos y limita la comparación a dos distritos", () => {
    expect(readMapUrlState("?district=99&districts=2,2,16,4&year=2010&variable=unknown&view=bad"))
      .toEqual({
        districtId: null,
        compareIds: [2, 4],
        year: 2025,
        variable: "icvsa",
        view: "numeric",
        layers: [],
      });
  });
});
