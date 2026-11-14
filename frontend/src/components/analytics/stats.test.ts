import { describe, expect, it } from "vitest";
import {
  computeGap,
  equipmentGap,
  municipalAverage,
  municipalEquipmentAverage,
  municipalGapRows,
  ndviChange,
  seriesPointForYear,
} from "./stats";
import { makeDistrict, makeSeries } from "../../test/fixtures";
import { semaphoreForScore } from "./format";

const withNulls = [
  makeDistrict({ district_id: 1, series: makeSeries({ ndvi: () => 0.4, icvsa: () => 60 }) }),
  makeDistrict({ district_id: 2, series: makeSeries({ ndvi: () => null, icvsa: () => 40 }) }),
  makeDistrict({ district_id: 3, series: makeSeries({ ndvi: () => 0.2, icvsa: () => 50 }) }),
];

describe("estadísticas distritales", () => {
  it("calcula el promedio municipal ignorando null y reporta n", () => {
    const result = municipalAverage(withNulls, "ndvi_mean", 2025);
    expect(result.n).toBe(2);
    expect(result.average).toBeCloseTo(0.3, 6);
    expect(municipalAverage([], "ndvi_mean", 2025)).toEqual({ average: null, n: 0 });
  });

  it("calcula brecha absoluta y relativa sin dividir por cero", () => {
    expect(computeGap(60, 50)).toEqual({ absolute: 10, relativePercent: 20 });
    expect(computeGap(50, 0)).toEqual({ absolute: 50, relativePercent: null });
    expect(computeGap(null, 50)).toBeNull();
    expect(computeGap(50, null)).toBeNull();
  });

  it("incluye brechas ambientales y de equipamiento con su n", () => {
    const rows = municipalGapRows(withNulls[0], withNulls, 2025);
    const icvsa = rows.find((row) => row.key === "socioenvironmental_index");
    const schools = rows.find((row) => row.key === "schools_per_1000");

    expect(icvsa?.value).toBe(60);
    expect(icvsa?.average).toBe(50);
    expect(icvsa?.gap?.absolute).toBe(10);
    expect(icvsa?.n).toBe(3);
    expect(schools?.label).toMatch(/escuelas/i);
    expect(schools?.n).toBe(3);
  });

  it("calcula el promedio territorial y la brecha de transporte", () => {
    const average = municipalEquipmentAverage(withNulls, "transport_coverage_fraction");
    expect(average.n).toBe(3);
    expect(average.average).toBeCloseTo(0.71, 6);
    const gap = equipmentGap(withNulls[0], withNulls, "transport_coverage_fraction");
    expect(gap.gap?.absolute).toBeCloseTo(0, 6);
  });

  it("calcula el cambio de NDVI entre el primer y último año válido", () => {
    const district = makeDistrict({
      district_id: 9,
      series: makeSeries({ ndvi: (year) => (year <= 2016 || year === 2025 ? null : 0.5 - (year - 2017) * 0.01) }),
    });
    const change = ndviChange(district);
    expect(change.available).toBe(true);
    expect(change.firstYear).toBe(2017);
    expect(change.lastYear).toBe(2024);
    expect(change.direction).toBe("loss");
    expect(change.relativePercent).toBeCloseTo(-14, 0);
  });

  it("marca insuficiente cuando no hay dos años de NDVI", () => {
    const district = makeDistrict({
      district_id: 9,
      series: makeSeries({ ndvi: (year) => (year === 2025 ? 0.4 : null) }),
    });
    const change = ndviChange(district);
    expect(change.available).toBe(false);
    expect(change.direction).toBe("insufficient");
  });

  it("respeta los límites del semáforo ICVSA", () => {
    expect(semaphoreForScore(70).key).toBe("favorable");
    expect(semaphoreForScore(69).key).toBe("intermedia");
    expect(semaphoreForScore(40).key).toBe("intermedia");
    expect(semaphoreForScore(39).key).toBe("atencion");
    expect(semaphoreForScore(1).key).toBe("atencion");
    expect(semaphoreForScore(null).key).toBe("insuficiente");
  });

  it("devuelve null si el año no existe en la serie", () => {
    expect(seriesPointForYear(withNulls[0], 1999)).toBeNull();
  });
});
