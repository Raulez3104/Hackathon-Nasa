import { describe, expect, it } from "vitest";
import {
  buildHotspotCollection,
  contributionsByVariable,
  evaluateHotspot,
  priorityForScore,
  priorityIcon,
  priorityLabel,
} from "./hotspot-rules";
import { makeDistrict, makeEquipment, makeSeries, makeTrend, TEST_DISTRICTS } from "../../test/fixtures";

function trendWith(
  variable: "ndvi" | "lst",
  overrides: Partial<ReturnType<typeof makeTrend>> = {},
) {
  return { ...makeTrend(variable, "worsening"), ...overrides };
}

const CRITICAL = makeDistrict({
  district_id: 9,
  name: "Distrito 9",
  latest_socioenvironmental_index: 32,
  series: makeSeries({ ndvi: () => 0.28, icvsa: () => 32 }),
  trends: [
    trendWith("ndvi", { slope_per_year: -0.012 }),
    trendWith("lst", { slope_per_year: 0.24 }),
  ],
  equipment: makeEquipment(9, {
    green_area_m2_per_capita: 2.1,
    mobility_access_index: 34,
    deficit_flags: ["GREEN_AREA_LOW", "MOBILITY_LOW"],
  }),
});

const CALM = makeDistrict({
  district_id: 10,
  series: makeSeries({ ndvi: () => 0.5, icvsa: () => 78 }),
  trends: [
    trendWith("ndvi", { direction: "stable", slope_per_year: 0.001 }),
    trendWith("lst", { direction: "stable", slope_per_year: -0.02 }),
  ],
  equipment: makeEquipment(10, {
    green_area_m2_per_capita: 9,
    mobility_access_index: 65,
    deficit_flags: [],
  }),
});

describe("reglas de hotspots", () => {
  it("activa todas las reglas y explica cada contribución", () => {
    const hotspot = evaluateHotspot(CRITICAL, 2025);

    expect(hotspot.score).toBe(100);
    expect(hotspot.priority_level).toBe("high");
    expect(hotspot.rules.map((rule) => rule.rule_id)).toEqual([
      "NDVI_NEGATIVE_TREND",
      "LST_POSITIVE_TREND",
      "EQUIPMENT_DEFICIT",
      "ICVSA_LOW",
      "MOBILITY_LOW",
    ]);
    expect(hotspot.rules.every((rule) => rule.triggered)).toBe(true);
    expect(hotspot.contributions).toEqual([
      { variable: "ndvi", label: "NDVI", points: 25, triggered: true },
      { variable: "lst", label: "LST", points: 25, triggered: true },
      { variable: "equipment", label: "Equipamiento", points: 20, triggered: true },
      { variable: "index", label: "ICVSA", points: 20, triggered: true },
      { variable: "mobility", label: "Movilidad", points: 10, triggered: true },
    ]);
    expect(hotspot.explanation).toMatch(/activa 5 reglas/i);
    expect(hotspot.explanation).toMatch(/no implica causalidad/i);
  });

  it("deja las reglas fuera de umbral con contribución cero", () => {
    const hotspot = evaluateHotspot(CALM, 2025);

    expect(hotspot.score).toBe(0);
    expect(hotspot.rules.every((rule) => !rule.triggered)).toBe(true);
    expect(hotspot.rules.every((rule) => rule.contribution === 0)).toBe(true);
    expect(hotspot.explanation).toBe("No activó reglas en el año consultado.");
  });

  it("usa la dirección declarada cuando la pendiente es nula", () => {
    const district = makeDistrict({
      district_id: 11,
      trends: [trendWith("ndvi", { direction: "worsening", slope_per_year: null })],
    });

    const hotspot = evaluateHotspot(district, 2025);
    const ndvi = hotspot.rules.find((rule) => rule.rule_id === "NDVI_NEGATIVE_TREND");
    expect(ndvi?.triggered).toBe(true);
    expect(ndvi?.observed_value).toBeNull();
  });

  it("ordena por puntaje, desempata por distrito y aplica la prioridad mínima", () => {
    const medium = makeDistrict({
      district_id: 12,
      series: makeSeries({ icvsa: () => 30 }),
      trends: [trendWith("ndvi", { direction: "stable", slope_per_year: 0.001 })],
      equipment: makeEquipment(12, { mobility_access_index: 60, deficit_flags: [] }),
    });

    const all = buildHotspotCollection([medium, CRITICAL, CALM], 2025, "low");
    expect(all.hotspots.map((hotspot) => hotspot.district_id)).toEqual([9, 12]);
    expect(all.hotspots[1].priority_level).toBe("medium");
    expect(all.computed_locally).toBe(true);
    expect(all.evaluated_districts).toBe(3);

    const highOnly = buildHotspotCollection([medium, CRITICAL, CALM], 2025, "high");
    expect(highOnly.hotspots.map((hotspot) => hotspot.district_id)).toEqual([9]);
  });

  it("devuelve un ranking vacío si ningún distrito cruza umbrales", () => {
    const collection = buildHotspotCollection([CALM], 2025);
    expect(collection.hotspots).toEqual([]);
    expect(collection.disclaimer).toMatch(/no es una evaluación oficial/i);
  });

  it("agrega la contribución por variable del ranking visible", () => {
    const collection = buildHotspotCollection([CRITICAL, TEST_DISTRICTS[1]], 2025, "low");
    const totals = contributionsByVariable(collection.hotspots);

    expect(totals.find((item) => item.variable === "ndvi")?.points).toBe(25);
    expect(totals[0].points).toBe(40);
    expect(totals.find((item) => item.variable === "equipment")?.points).toBe(40);
    expect(totals.find((item) => item.variable === "index")?.points).toBe(40);
  });

  it("traduce la prioridad con texto e ícono", () => {
    expect(priorityForScore(75)).toBe("high");
    expect(priorityForScore(45)).toBe("medium");
    expect(priorityForScore(10)).toBe("low");
    expect(priorityLabel("high")).toBe("Prioridad alta");
    expect(priorityLabel("medium")).toBe("Prioridad media");
    expect(priorityIcon("high")).toBe("▼");
    expect(priorityIcon("low")).toBe("▲");
  });
});
