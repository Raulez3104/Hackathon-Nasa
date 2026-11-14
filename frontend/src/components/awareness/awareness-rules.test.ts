import { describe, expect, it } from "vitest";
import {
  assessAwareness,
  directionIcon,
  directionLabel,
  rankGreenCover,
  sourceLabel,
} from "./awareness-rules";
import { makeDistrict, makeSeries, makeTrend } from "../../test/fixtures";

const reference = [
  makeDistrict({ district_id: 1 }),
  makeDistrict({
    district_id: 2,
    name: "Distrito 2",
    equipment: {
      district_id: 2,
      territorial_reference_year: 2024,
      population: 48210,
      green_area_m2_per_capita: 1.5,
      schools_per_1000: 0.8,
      health_centers_per_1000: 0.2,
      transport_coverage_fraction: 0.4,
      equipment_access_index: 39,
      mobility_access_index: 44,
      deficit_flags: ["GREEN_AREA_LOW"],
    },
  }),
  makeDistrict({ district_id: 3 }),
];

function districtWithDecliningNdvi() {
  return makeDistrict({
    district_id: 5,
    series: makeSeries({ ndvi: (year) => 0.5 - (year - 2015) * 0.02 }),
    trends: [makeTrend("ndvi", "worsening"), makeTrend("socioenvironmental_index", "worsening")],
  });
}

describe("reglas de concientización", () => {
  it("describe una pérdida de NDVI sin afirmar causas", () => {
    const assessment = assessAwareness(districtWithDecliningNdvi(), reference, 2025);

    expect(assessment.direction).toBe("loss");
    expect(assessment.headline).toMatch(/pérdida de vigor vegetal \(NDVI\) entre 2015 y 2025/i);
    expect(assessment.strategies.map((strategy) => strategy.id)).toContain("monitor-loss");
    expect(assessment.strategies.map((strategy) => strategy.id)).toContain("citizen-campaign");
    expect(assessment.caveats.join(" ")).toMatch(/no demuestran causas/i);
  });

  it("cita la fuente declarada y su año sin inventar cifras", () => {
    const district = districtWithDecliningNdvi();
    const assessment = assessAwareness(district, reference, 2025);
    const strategy = assessment.strategies[0];

    expect(strategy.sourceRef).toBe("mock");
    expect(strategy.indicator.value).toContain("0,500");
    expect(strategy.indicator.value).toContain("0,300");
    expect(strategy.indicator.year).toBe(2025);
    expect(assessment.citations[0]).toMatchObject({
      sourceRef: "mock",
      label: "Mock ilustrativo de desarrollo",
      year: 2025,
    });
    expect(assessment.citations.some((citation) => citation.sourceRef === "territorial_reference")).toBe(true);
  });

  it("declara serie insuficiente cuando no hay dos años válidos", () => {
    const district = makeDistrict({
      district_id: 6,
      series: makeSeries({ ndvi: (year) => (year === 2025 ? 0.4 : null) }),
    });
    const assessment = assessAwareness(district, reference, 2025);

    expect(assessment.direction).toBe("insufficient");
    expect(assessment.change.available).toBe(false);
    expect(assessment.strategies[0].id).toBe("complete-series");
    expect(assessment.messages.some((message) => /todavía no hay suficientes años/i.test(message.text))).toBe(true);
    expect(assessment.headline).toMatch(/no hay suficientes años con dato de NDVI/i);
  });

  it("agrega una estrategia de área verde solo si está bajo el promedio municipal", () => {
    const low = reference[1];
    const assessmentLow = assessAwareness(low, reference, 2025);
    expect(assessmentLow.strategies.some((strategy) => strategy.id === "green-area-gap")).toBe(true);

    const high = makeDistrict({
      district_id: 7,
      equipment: {
        district_id: 7,
        territorial_reference_year: 2024,
        population: 1000,
        green_area_m2_per_capita: 40,
        schools_per_1000: 1,
        health_centers_per_1000: 0.4,
        transport_coverage_fraction: 0.6,
        equipment_access_index: 60,
        mobility_access_index: 60,
        deficit_flags: [],
      },
    });
    const assessmentHigh = assessAwareness(high, [...reference, high], 2025);
    expect(assessmentHigh.strategies.some((strategy) => strategy.id === "green-area-gap")).toBe(false);
  });

  it("sugiere una estrategia de calor cuando la tendencia de LST empeora", () => {
    const district = makeDistrict({
      district_id: 8,
      trends: [makeTrend("lst", "worsening")],
    });
    const assessment = assessAwareness(district, reference, 2025);
    const heat = assessment.strategies.find((strategy) => strategy.id === "heat-awareness");

    expect(heat).toBeDefined();
    expect(heat?.rationale).toMatch(/temperatura superficial, no del aire/i);
  });

  it("no supera tres estrategias por distrito", () => {
    const district = makeDistrict({
      district_id: 9,
      series: makeSeries({ ndvi: (year) => 0.6 - (year - 2015) * 0.05 }),
      trends: [makeTrend("ndvi", "worsening"), makeTrend("lst", "worsening")],
      equipment: reference[1].equipment,
    });
    const assessment = assessAwareness(district, reference, 2025);
    expect(assessment.strategies.length).toBeLessThanOrEqual(3);
  });

  it("ordena el cambio de cobertura verde y deja los vacíos al final", () => {
    const districts = [
      makeDistrict({
        district_id: 1,
        series: makeSeries({ ndvi: (year) => (year === 2015 ? 0.4 : null) }),
      }),
      makeDistrict({
        district_id: 2,
        series: makeSeries({ ndvi: (year) => (year === 2015 ? 0.6 : 0.2) }),
      }),
      makeDistrict({
        district_id: 3,
        series: makeSeries({ ndvi: (year) => (year === 2015 ? 0.2 : 0.5) }),
      }),
    ];

    const ranking = rankGreenCover(districts);
    expect(ranking.map((row) => row.districtId)).toEqual([2, 3, 1]);
    expect(ranking[2].direction).toBe("insufficient");
  });

  it("traduce direcciones y fuentes desconocidas sin inventar etiquetas", () => {
    expect(directionLabel("loss")).toBe("Pérdida de vigor");
    expect(directionLabel("gain")).toBe("Ganancia de vigor");
    expect(directionIcon("insufficient")).toBe("?");
    expect(sourceLabel("mock")).toBe("Mock ilustrativo de desarrollo");
    expect(sourceLabel("gamc_transport")).toBe("GAMC · transporte");
    expect(sourceLabel("fuente_nueva")).toBe("fuente nueva");
    expect(sourceLabel(null)).toBe("Sin fuente declarada");
  });
});
