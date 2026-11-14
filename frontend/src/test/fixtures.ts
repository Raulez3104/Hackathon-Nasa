import type {
  DistrictData,
  DistrictSeriesPoint,
  DistrictTrend,
  EquipmentMetrics,
} from "../../../shared/types/geoqocha";

export function makeSeries(options: {
  startYear?: number;
  endYear?: number;
  ndvi?: (year: number) => number | null;
  lst?: (year: number) => number | null;
  icvsa?: (year: number) => number | null;
} = {}): DistrictSeriesPoint[] {
  const start = options.startYear ?? 2015;
  const end = options.endYear ?? 2025;
  const points: DistrictSeriesPoint[] = [];
  for (let year = start; year <= end; year += 1) {
    const offset = year - start;
    points.push({
      year,
      ndvi_mean: options.ndvi ? options.ndvi(year) : Number((0.42 + offset * 0.001).toFixed(3)),
      lst_mean_celsius: options.lst ? options.lst(year) : Number((29.5 + offset * 0.1).toFixed(1)),
      environmental_index: 67,
      socioenvironmental_index: options.icvsa ? options.icvsa(year) : 64,
      index_without_territorial: 67,
      data_quality_flag: "ok",
    });
  }
  return points;
}

export function makeTrend(variable: DistrictTrend["variable"], direction: DistrictTrend["direction"]): DistrictTrend {
  return {
    variable,
    direction,
    slope_per_year: direction === "worsening" ? -0.002 : 0.001,
    unit: variable === "ndvi" ? "NDVI/año" : "índice/año",
    years_used: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    method: "OLS sobre medias anuales (fixture de prueba)",
    is_significant: null,
    acceleration: null,
    accelerated: false,
    notes: ["Fixture de prueba."],
  };
}

export function makeEquipment(districtId: number, overrides: Partial<EquipmentMetrics> = {}): EquipmentMetrics {
  return {
    district_id: districtId,
    territorial_reference_year: 2024,
    population: 48210,
    green_area_m2_per_capita: 3.8,
    schools_per_1000: 1.2,
    health_centers_per_1000: 0.4,
    transport_coverage_fraction: 0.71,
    equipment_access_index: 58,
    mobility_access_index: 61,
    deficit_flags: ["GREEN_AREA_LOW"],
    ...overrides,
  };
}

export function makeDistrict(overrides: Partial<DistrictData> & { district_id: number }): DistrictData {
  const { district_id: districtId, ...rest } = overrides;
  return {
    district_id: districtId,
    name: `Distrito ${districtId}`,
    geometry: null,
    area_km2: 12.4,
    population: 48210,
    population_year: 2024,
    territorial_reference_year: 2024,
    latest_year: 2025,
    latest_socioenvironmental_index: 64,
    risk_level: "medium",
    series: makeSeries(),
    trends: [makeTrend("ndvi", "stable"), makeTrend("socioenvironmental_index", "improving")],
    equipment: makeEquipment(districtId),
    transport_stops: [],
    data_status: "illustrative",
    source_refs: ["mock"],
    ...rest,
  };
}

export const TEST_DISTRICTS: DistrictData[] = [
  makeDistrict({ district_id: 1 }),
  makeDistrict({
    district_id: 2,
    name: "Distrito 2",
    latest_socioenvironmental_index: 38,
    series: makeSeries({ ndvi: (year) => (year === 2025 ? null : 0.31), icvsa: () => 38 }),
    equipment: makeEquipment(2, {
      equipment_access_index: 39,
      mobility_access_index: 44,
      green_area_m2_per_capita: 1.9,
      schools_per_1000: 0.8,
      health_centers_per_1000: 0.2,
      transport_coverage_fraction: 0.4,
    }),
    trends: [makeTrend("ndvi", "worsening"), makeTrend("socioenvironmental_index", "worsening")],
  }),
  makeDistrict({ district_id: 3, name: "Distrito 3", latest_socioenvironmental_index: 76 }),
];
