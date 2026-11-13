import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve(import.meta.dirname, "../frontend/public/data/mock_distritos.json");
const years = Array.from({ length: 11 }, (_, index) => 2015 + index);

const districts = Array.from({ length: 15 }, (_, index) => {
  const districtId = index + 1;
  const baseLon = -66.24 + (index % 5) * 0.025;
  const baseLat = -17.49 + Math.floor(index / 5) * 0.035;
  const geometry = {
    type: "Polygon",
    coordinates: [[
      [baseLon, baseLat],
      [baseLon + 0.018, baseLat],
      [baseLon + 0.018, baseLat + 0.018],
      [baseLon, baseLat + 0.018],
      [baseLon, baseLat],
    ]],
  };

  const series = years.map((year, yearIndex) => {
    const ndvi = Number((0.28 + districtId * 0.008 + yearIndex * 0.002).toFixed(3));
    const lst = Number((31.5 - districtId * 0.12 - yearIndex * 0.08).toFixed(2));
    const environmentalIndex = Math.round(42 + districtId + yearIndex * 0.8);
    return {
      year,
      ndvi_mean: ndvi,
      lst_mean_celsius: lst,
      environmental_index: environmentalIndex,
      socioenvironmental_index: Math.min(100, environmentalIndex + 5),
      index_without_territorial: environmentalIndex,
      data_quality_flag: "ok",
    };
  });

  const latest = series.at(-1);
  return {
    district_id: districtId,
    name: `Distrito ${districtId}`,
    geometry,
    area_km2: Number((8.5 + districtId * 0.7).toFixed(1)),
    population: 30000 + districtId * 2500,
    population_year: 2024,
    territorial_reference_year: 2024,
    latest_year: latest.year,
    latest_socioenvironmental_index: latest.socioenvironmental_index,
    risk_level: latest.socioenvironmental_index < 50 ? "high" : latest.socioenvironmental_index < 70 ? "medium" : "low",
    series,
    trends: [{
      variable: "ndvi",
      direction: "improving",
      slope_per_year: 0.002,
      unit: "NDVI/año",
      years_used: years,
      method: "Datos ilustrativos generados para desarrollo",
      is_significant: null,
      acceleration: null,
      accelerated: false,
      notes: ["Ejemplo ilustrativo; no representa mediciones reales."],
    }],
    equipment: {
      district_id: districtId,
      territorial_reference_year: 2024,
      population: 30000 + districtId * 2500,
      green_area_m2_per_capita: Number((3 + districtId * 0.2).toFixed(1)),
      schools_per_1000: Number((0.8 + districtId * 0.03).toFixed(2)),
      health_centers_per_1000: Number((0.2 + districtId * 0.01).toFixed(2)),
      transport_coverage_fraction: Number((0.45 + districtId * 0.02).toFixed(2)),
      equipment_access_index: 45 + districtId,
      mobility_access_index: 50 + districtId,
      deficit_flags: districtId % 3 === 0 ? ["GREEN_AREA_LOW"] : [],
    },
    transport_stops: [{
      stop_id: `stop-${String(districtId).padStart(3, "0")}`,
      name: `Punto propuesto ${districtId}`,
      district_id: districtId,
      latitude: Number((baseLat + 0.009).toFixed(6)),
      longitude: Number((baseLon + 0.009).toFixed(6)),
      routes: [`R${(districtId % 4) + 1}`],
      boarding_recommended: true,
      safety_score: null,
      notes: "Punto ilustrativo; no es una parada oficial ni una calificación de seguridad.",
      data_status: "illustrative",
    }],
    data_status: "illustrative",
    source_refs: ["mock"],
  };
});

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({
  contract_version: "0.1.0",
  data_status: "illustrative",
  generated_at: new Date().toISOString(),
  districts,
}, null, 2)}\n`, "utf8");

console.log(`Mock generado en ${output}`);
