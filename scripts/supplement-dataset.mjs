import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

const root = resolve(import.meta.dirname, "..");
const processedPath = resolve(root, "data/processed/distritos_data.json");
const districtYearPath = resolve(root, "data/processed/district_year.json");
const mockPath = resolve(root, "frontend/public/data/mock_distritos.json");
const realPublicPath = resolve(root, "frontend/public/data/distritos_data.json");
const sourcesPath = resolve(root, "data/metadata/sources.json");
const YEARS = Array.from({ length: 11 }, (_, index) => 2015 + index);
const REAL_YEARS = new Set([2019, 2020, 2021, 2022]);
const NUMERIC_FIELDS = [
  "ndvi_mean",
  "lst_mean_celsius",
  "environmental_index",
  "socioenvironmental_index",
  "index_without_territorial",
];

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const round = (value, digits) => Number(value.toFixed(digits));

function supplementPoint(realPoint, mockPoint, anchorPoint, year) {
  const result = { ...realPoint, ...mockPoint, year };
  for (const field of NUMERIC_FIELDS) {
    const mockValue = mockPoint?.[field];
    const anchorMockValue = mockPoint?.__anchor?.[field];
    const anchorRealValue = anchorPoint?.[field];
    if (typeof mockValue !== "number" || typeof anchorMockValue !== "number" || typeof anchorRealValue !== "number") {
      result[field] = null;
      continue;
    }
    const digits = field === "ndvi_mean" ? 4 : field === "lst_mean_celsius" ? 2 : 1;
    result[field] = round(anchorRealValue + (mockValue - anchorMockValue), digits);
  }
  result.data_quality_flag = "partial";
  result.data_status = "illustrative";
  return result;
}

function attachMockAnchors(mockDistrict, mockSeries) {
  return mockSeries.map((point) => ({
    ...point,
    __anchor: mockSeries.find((candidate) => candidate.year === (point.year < 2019 ? 2019 : 2022)),
  }));
}

const realDataset = await readJson(processedPath);
const mockDataset = await readJson(mockPath);
const mockById = new Map(mockDataset.districts.map((district) => [
  district.district_id,
  attachMockAnchors(district, district.series),
]));

for (const district of realDataset.districts) {
  const mockSeries = mockById.get(district.district_id) ?? [];
  const realByYear = new Map(district.series.map((point) => [point.year, point]));
  const supplemented = YEARS.map((year) => {
    const realPoint = realByYear.get(year) ?? { year };
    if (REAL_YEARS.has(year)) {
      return { ...realPoint, data_status: "real" };
    }
    const mockPoint = mockSeries.find((point) => point.year === year);
    const anchorYear = year < 2019 ? 2019 : 2022;
    const anchorPoint = realByYear.get(anchorYear);
    return supplementPoint(realPoint, mockPoint, anchorPoint, year);
  });
  district.series = supplemented;
  // latest_year conserva el último año con observación real; la UI puede elegir
  // toda la serie complementada explícitamente.
  district.latest_year = 2022;
  district.latest_socioenvironmental_index = supplemented.find((point) => point.year === 2022).socioenvironmental_index;
  district.source_refs = [...new Set([...district.source_refs, "mock_supplement"])];
  // El distrito contiene datos reales y complementarios; el estado por año es la fuente de verdad.
  district.data_status = "real";
}

realDataset.generated_at = new Date().toISOString();
await writeFile(processedPath, `${JSON.stringify(realDataset, null, 2)}\n`);
await mkdir(dirname(realPublicPath), { recursive: true });
await writeFile(realPublicPath, `${JSON.stringify(realDataset, null, 2)}\n`);

const districtYear = await readJson(districtYearPath);
for (const record of districtYear.records) {
  const district = realDataset.districts.find((item) => item.district_id === record.district_id);
  const point = district?.series.find((item) => item.year === record.year);
  if (!point) continue;
  for (const field of NUMERIC_FIELDS) record[field] = point[field];
  record.data_quality_flag = point.data_status === "illustrative" ? "partial" : point.data_quality_flag;
  record.source_refs = [...new Set([...(record.source_refs ?? []), ...(point.data_status === "illustrative" ? ["mock_supplement"] : [])])];
}
districtYear.generated_at = realDataset.generated_at;
await writeFile(districtYearPath, `${JSON.stringify(districtYear, null, 2)}\n`);

const publicMock = structuredClone(realDataset);
publicMock.data_status = "illustrative";
for (const district of publicMock.districts) {
  district.data_status = "illustrative";
  district.source_refs = ["mock_supplement"];
  district.series = district.series.map((point) => ({ ...point, data_status: "illustrative" }));
}
await writeFile(mockPath, `${JSON.stringify(publicMock, null, 2)}\n`);

const sources = await readJson(sourcesPath);
if (!sources.sources.some((source) => source.id === "mock_supplement")) {
  sources.sources.push({
    id: "mock_supplement",
    name: "Complemento ilustrativo basado en patrones 2019–2022",
    organization: "Equipo GeoQocha",
    url: "https://github.com/Raulez3104/Hackathon-Nasa",
    reference_date: "2015/2025",
    license: "CC BY 4.0 para datos ilustrativos",
    transformations: [
      "Se conservaron sin cambios las observaciones reales 2019–2022",
      "Se generaron valores ilustrativos únicamente para 2015–2018 y 2023–2025",
      "Ajuste determinista por distrito usando como anclas los valores reales disponibles",
    ],
    limitations: [
      "No son mediciones NASA ni datos oficiales para los años complementados",
      "No deben usarse para inferir tendencias oficiales",
    ],
  });
}
sources.coverage = {
  ...(sources.coverage ?? {}),
  environmental: {
    districts: 15,
    years: YEARS,
    real_years: [...REAL_YEARS],
    illustrative_years: YEARS.filter((year) => !REAL_YEARS.has(year)),
    observations: 165,
  },
};
sources.generated_at = realDataset.generated_at;
await writeFile(sourcesPath, `${JSON.stringify(sources, null, 2)}\n`);

console.log("Dataset suplementado: 2019–2022 real; 2015–2018 y 2023–2025 ilustrativo.");
