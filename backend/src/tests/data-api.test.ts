import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import { closeTestServer, getJson, startTestServer, type TestServer } from "./helpers.js";

interface ApiError {
  error: { code: string; message: string; details: unknown };
}

let testServer: TestServer;

before(async () => {
  testServer = await startTestServer();
});

after(async () => {
  await closeTestServer(testServer.server);
});

test("GET /api/health reporta dataset y modo", async () => {
  const { status, body } = await getJson<{
    status: string;
    data: { last_processed_year: number; data_mode: string; methodology_version: string };
  }>(testServer.baseUrl, "/api/health");
  assert.equal(status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.data.last_processed_year, 2025);
  assert.equal(body.data.data_mode, "mock");
  assert.equal(body.data.methodology_version, "0.1.0");
});

test("GET /api/districts devuelve los 15 distritos con geometría opcional", async () => {
  const plain = await getJson<{ count: number; districts: Array<Record<string, unknown>> }>(
    testServer.baseUrl,
    "/api/districts",
  );
  assert.equal(plain.status, 200);
  assert.equal(plain.body.count, 15);
  assert.equal(plain.body.districts.length, 15);
  assert.equal("geometry" in plain.body.districts[0], false);

  const withGeometry = await getJson<{ districts: Array<{ geometry?: { type: string } }> }>(
    testServer.baseUrl,
    "/api/districts?include_geometry=true",
  );
  assert.equal(withGeometry.body.districts[0].geometry?.type, "Polygon");
});

test("GET /api/districts/:id entrega ficha, tendencias y resumen", async () => {
  const { status, body } = await getJson<{
    district_id: number;
    latest: { year: number; data_quality_flag: string };
    trends: unknown[];
    summary_text: string;
  }>(testServer.baseUrl, "/api/districts/1");
  assert.equal(status, 200);
  assert.equal(body.district_id, 1);
  assert.equal(body.latest.year, 2025);
  assert.ok(body.trends.length >= 3);
  assert.match(body.summary_text, /Distrito 1/);
});

test("GET /api/districts/:id responde 404 para distrito inexistente", async () => {
  const { status, body } = await getJson<ApiError>(testServer.baseUrl, "/api/districts/999");
  assert.equal(status, 404);
  assert.equal(body.error.code, "DISTRICT_NOT_FOUND");
});

test("GET /api/districts/:id/indicators completa el rango y filtra variables", async () => {
  const full = await getJson<{ series: Array<Record<string, unknown>>; metadata: { methodology_version: string } }>(
    testServer.baseUrl,
    "/api/districts/1/indicators?from=2024&to=2025",
  );
  assert.equal(full.status, 200);
  assert.equal(full.body.series.length, 2);
  assert.equal(full.body.series[0].year, 2024);
  assert.equal(full.body.series[1].year, 2025);
  assert.equal(full.body.metadata.methodology_version, "0.1.0");

  const filtered = await getJson<{ series: Array<Record<string, unknown>> }>(
    testServer.baseUrl,
    "/api/districts/1/indicators?from=2025&to=2025&variables=ndvi",
  );
  assert.equal(Object.hasOwn(filtered.body.series[0], "ndvi_mean"), true);
  assert.equal(Object.hasOwn(filtered.body.series[0], "lst_mean_celsius"), false);
});

test("GET /api/districts/:id/indicators valida el rango", async () => {
  const { status, body } = await getJson<ApiError>(
    testServer.baseUrl,
    "/api/districts/1/indicators?from=2025&to=2020",
  );
  assert.equal(status, 400);
  assert.equal(body.error.code, "INVALID_PARAMETER");
});

test("GET /api/comparison calcula brechas y diferencias", async () => {
  const { status, body } = await getJson<{
    year: number;
    districts: unknown[];
    gaps_vs_municipal_average: unknown[];
    differences: unknown[];
  }>(testServer.baseUrl, "/api/comparison?districts=1,2&year=2025");
  assert.equal(status, 200);
  assert.equal(body.year, 2025);
  assert.equal(body.districts.length, 2);
  assert.ok(body.gaps_vs_municipal_average.length > 0);
  assert.ok(body.differences.length > 0);
});

test("GET /api/comparison exige al menos dos distritos", async () => {
  const { status, body } = await getJson<ApiError>(testServer.baseUrl, "/api/comparison?districts=1&year=2025");
  assert.equal(status, 400);
  assert.equal(body.error.code, "INVALID_PARAMETER");
});

test("GET /api/comparison rechaza distritos repetidos", async () => {
  const { status, body } = await getJson<ApiError>(testServer.baseUrl, "/api/comparison?districts=1,1&year=2025");
  assert.equal(status, 400);
  assert.equal(body.error.code, "INVALID_PARAMETER");
});

test("GET /api/hotspots devuelve ranking explicable", async () => {
  const { status, body } = await getJson<{
    year: number;
    disclaimer: string;
    hotspots: Array<{ score: number | null; priority_level: string; rules: unknown[] }>;
  }>(testServer.baseUrl, "/api/hotspots?year=2025&min_priority=low");
  assert.equal(status, 200);
  assert.equal(body.year, 2025);
  assert.match(body.disclaimer, /No es una evaluación oficial/);
  assert.ok(body.hotspots.length > 0);
  assert.ok(body.hotspots[0].rules.length > 0);
});

test("GET /api/methodology publica pesos y política temporal", async () => {
  const { status, body } = await getJson<{
    version: string;
    index: { weights: Record<string, number>; temporal_policy: { interpolation_allowed: boolean } };
  }>(testServer.baseUrl, "/api/methodology");
  assert.equal(status, 200);
  assert.equal(body.version, "0.1.0");
  assert.equal(body.index.weights.vegetation, 0.35);
  assert.equal(body.index.weights.urban_equipment, 0.2);
  assert.equal(body.index.temporal_policy.interpolation_allowed, false);
});

test("GET /api/sources lista fuentes con licencia y limitaciones", async () => {
  const { status, body } = await getJson<{ sources: Array<{ id: string; license: string | null }> }>(
    testServer.baseUrl,
    "/api/sources",
  );
  assert.equal(status, 200);
  assert.ok(body.sources.length >= 3);
  assert.ok(body.sources.some((source) => source.id === "nasa_mod13q1"));
});

test("GET /api/heatmap entrega celdas y raster", async () => {
  const cells = await getJson<{ variable: string; cells: unknown[]; resolution_m: number }>(
    testServer.baseUrl,
    "/api/heatmap?variable=lst&year=2025",
  );
  assert.equal(cells.status, 200);
  assert.equal(cells.body.variable, "lst");
  assert.equal(cells.body.cells.length, 15);
  assert.equal(cells.body.resolution_m, 1000);

  const raster = await getJson<{ raster_url: string; bbox: number[] }>(
    testServer.baseUrl,
    "/api/heatmap?variable=lst&year=2025&format=raster",
  );
  assert.equal(raster.status, 200);
  assert.equal(raster.body.raster_url, "/api/heatmap/2025/lst.png");
  assert.equal(raster.body.bbox.length, 4);

  const image = await fetch(`${testServer.baseUrl}${raster.body.raster_url}`);
  assert.equal(image.status, 200);
  assert.match(image.headers.get("content-type") ?? "", /image\/png/);
});

test("GET /api/analysis/correlation informa n y no calcula sin variación", async () => {
  const defaultCase = await getJson<{
    coefficient: number | null;
    n: number;
    method: string;
    interpretation: string;
    disclaimer: string;
  }>(testServer.baseUrl, "/api/analysis/correlation?x=ndvi_trend&y=equipment_access_index");
  assert.equal(defaultCase.status, 200);
  assert.equal(defaultCase.body.n, 15);
  assert.equal(defaultCase.body.coefficient, null);
  assert.match(defaultCase.body.interpretation, /no tiene variación suficiente/);
  assert.match(defaultCase.body.disclaimer, /No establecer causalidad/);

  const varied = await getJson<{ coefficient: number; n: number; method: string }>(
    testServer.baseUrl,
    "/api/analysis/correlation?x=environmental_index_trend&y=equipment_access_index",
  );
  assert.equal(varied.status, 200);
  assert.equal(varied.body.n, 15);
  assert.equal(varied.body.method, "spearman");
  assert.equal(typeof varied.body.coefficient, "number");
});

test("GET /api/analysis/correlation valida el parámetro x", async () => {
  const { status, body } = await getJson<ApiError>(testServer.baseUrl, "/api/analysis/correlation?x=inventado");
  assert.equal(status, 400);
  assert.equal(body.error.code, "INVALID_PARAMETER");
});

test("Las rutas desconocidas usan el envoltorio de error", async () => {
  const { status, body } = await getJson<ApiError>(testServer.baseUrl, "/api/no-existe");
  assert.equal(status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
});
