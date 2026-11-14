import { describe, expect, it } from "vitest";
import {
  parseComparisonIds,
  parseDistrictId,
  parsePanel,
  parseYear,
  readUrlState,
  writeUrlPatch,
} from "./use-url-state";

describe("estado del panel en la URL", () => {
  it("acepta solo district_id del 1 al 15", () => {
    expect(parseDistrictId("1")).toBe(1);
    expect(parseDistrictId("15")).toBe(15);
    expect(parseDistrictId("0")).toBeNull();
    expect(parseDistrictId("16")).toBeNull();
    expect(parseDistrictId("3.5")).toBeNull();
    expect(parseDistrictId("abc")).toBeNull();
    expect(parseDistrictId(null)).toBeNull();
  });

  it("normaliza districts, elimina duplicados y limita la lista", () => {
    expect(parseComparisonIds("3,9,3")).toEqual([3, 9]);
    expect(parseComparisonIds("1,2,3,4,5,6,7")).toEqual([1, 2, 3, 4, 5]);
    expect(parseComparisonIds("99,0,x,4")).toEqual([4]);
    expect(parseComparisonIds(null)).toEqual([]);
  });

  it("valida el año y el panel", () => {
    expect(parseYear("2015")).toBe(2015);
    expect(parseYear("2025")).toBe(2025);
    expect(parseYear("2014")).toBeNull();
    expect(parseYear("2026")).toBeNull();
    expect(parsePanel("district")).toBe("district");
    expect(parsePanel("chat")).toBe("chat");
    expect(parsePanel("awareness")).toBe("awareness");
    expect(parsePanel("otro")).toBeNull();
  });

  it("lee la URL completa", () => {
    expect(readUrlState("?district=3&districts=3,9&year=2025&panel=district&view=semaphore")).toEqual({
      districtId: 3,
      compareIds: [3, 9],
      year: 2025,
      panel: "district",
    });
  });

  it("escribe el estado sin perder parámetros de otros frentes", () => {
    window.history.replaceState({}, "", "/?variable=icvsa&view=semaphore&layers=green,health");

    writeUrlPatch({ districtId: 3, compareIds: [3, 9], year: 2025, panel: "district" });
    const params = new URLSearchParams(window.location.search);

    expect(params.get("district")).toBe("3");
    expect(params.get("districts")).toBe("3,9");
    expect(params.get("year")).toBe("2025");
    expect(params.get("panel")).toBe("district");
    expect(params.get("variable")).toBe("icvsa");
    expect(params.get("view")).toBe("semaphore");
    expect(params.get("layers")).toBe("green,health");

    writeUrlPatch({ districtId: null, compareIds: [], panel: null });
    const cleaned = new URLSearchParams(window.location.search);
    expect(cleaned.get("district")).toBeNull();
    expect(cleaned.get("districts")).toBeNull();
    expect(cleaned.get("panel")).toBeNull();
    expect(cleaned.get("variable")).toBe("icvsa");
  });
});
