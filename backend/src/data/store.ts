import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ApiError } from "../http/errors.js";
import type {
  DatasetFile,
  DistrictData,
  DistrictSeriesPoint,
  DistrictYearRecord,
  SourceMetadata,
} from "../types/geoqocha.js";
import { METHODOLOGY_VERSION } from "../types/geoqocha.js";
import { WEIGHTS } from "./constants.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const DATA_PROCESSED_DIR = path.join(REPO_ROOT, "data", "processed");
export const DATA_METADATA_DIR = path.join(REPO_ROOT, "data", "metadata");

const DATASET_CANDIDATES = [
  path.join(DATA_PROCESSED_DIR, "distritos_data.json"),
  path.join(REPO_ROOT, "frontend", "public", "data", "distritos_data.json"),
  path.join(REPO_ROOT, "frontend", "public", "data", "mock_distritos.json"),
];

interface CacheEntry<T> {
  mtimeMs: number;
  value: T;
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function readCached<T>(filePath: string, cache: Map<string, CacheEntry<T>>): T | null {
  if (!existsSync(filePath)) return null;
  const mtimeMs = statSync(filePath).mtimeMs;
  const cached = cache.get(filePath);
  if (cached && cached.mtimeMs === mtimeMs) return cached.value;
  const value = readJsonFile<T>(filePath);
  cache.set(filePath, { mtimeMs, value });
  return value;
}

const DEFAULT_SOURCES: SourceMetadata[] = [
  {
    id: "mock",
    name: "Mock de desarrollo GeoQocha",
    organization: "Equipo GeoQocha",
    url: "https://github.com/Raulez3104/Hackathon-Nasa",
    reference_date: "2026-11-13",
    license: "CC BY 4.0 para datos ilustrativos",
    transformations: ["Datos sintéticos generados para desarrollo"],
    limitations: ["No representa mediciones reales ni datos oficiales"],
  },
  {
    id: "nasa_mod13q1",
    name: "MODIS MOD13Q1 (NDVI), colección 6.1",
    organization: "NASA",
    url: "https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1",
    reference_date: "2015/2025",
    license: "NASA open data (verificar términos)",
    transformations: ["Máscara QA", "Ventana estacional fija", "Media anual"],
    limitations: ["Resolución 250 m", "Variabilidad estacional"],
  },
  {
    id: "nasa_mod11a2",
    name: "MODIS MOD11A2 (LST), colección 6.1",
    organization: "NASA",
    url: "https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD11A2",
    reference_date: "2015/2025",
    license: "NASA open data (verificar términos)",
    transformations: ["Máscara QC", "Conversión a °C", "Media anual"],
    limitations: ["Resolución 1 km", "LST es temperatura superficial, no del aire"],
  },
  {
    id: "gamc_equipment",
    name: "GAMC, equipamiento municipal",
    organization: "Gobierno Autónomo Municipal de Cochabamba",
    url: "https://recursosgamc.cochabamba.bo/api-doc",
    reference_date: null,
    license: "Verificar condiciones de uso del GAMC",
    transformations: ["Agregación por distrito", "Normalización min-max"],
    limitations: ["Depende de la entrega vectorial municipal"],
  },
  {
    id: "geoqocha_methodology",
    name: "Metodología ICVSA GeoQocha",
    organization: "Equipo GeoQocha",
    url: "https://github.com/Raulez3104/Hackathon-Nasa",
    reference_date: `v${METHODOLOGY_VERSION}`,
    license: "CC BY 4.0",
    transformations: ["Normalización min-max", "Ponderación ICVSA", "Reglas de hotspot"],
    limitations: ["Indicador sintético de apoyo"],
  },
];

interface SourcesFile {
  sources: SourceMetadata[];
}

interface DistrictYearFile {
  records: DistrictYearRecord[];
}

interface MethodFile {
  methodology_version?: string;
  weights?: Record<string, number>;
  normalization?: Record<string, unknown>;
  temporal_policy?: Record<string, unknown>;
  sensitivity?: Record<string, unknown>;
}

interface HeatmapFile {
  raster_urls?: Record<string, string>;
  bbox?: number[];
  attribution?: string;
}

export class DatasetStore {
  private datasetCache = new Map<string, CacheEntry<DatasetFile>>();
  private jsonCache = new Map<string, CacheEntry<unknown>>();
  private resolvedPath: string | null = null;

  constructor(private readonly candidates: string[] = DATASET_CANDIDATES) {}

  private findDatasetPath(): string {
    if (this.resolvedPath && existsSync(this.resolvedPath)) return this.resolvedPath;
    const found = this.candidates.find((candidate) => existsSync(candidate));
    if (!found) {
      throw new ApiError(503, "NO_DATA", "No hay dataset disponible. Ejecute el pipeline o publique el mock.", {
        candidates: this.candidates,
      });
    }
    this.resolvedPath = found;
    return found;
  }

  getDatasetPath(): string {
    return this.findDatasetPath();
  }

  getDataset(): DatasetFile {
    const filePath = this.findDatasetPath();
    const dataset = readCached<DatasetFile>(filePath, this.datasetCache);
    if (!dataset || !Array.isArray(dataset.districts)) {
      throw new ApiError(503, "NO_DATA", "El dataset no tiene el formato esperado.", { path: filePath });
    }
    return dataset;
  }

  getDistrict(districtId: number): DistrictData | undefined {
    return this.getDataset().districts.find((district) => district.district_id === districtId);
  }

  requireDistrict(districtId: number): DistrictData {
    const district = this.getDistrict(districtId);
    if (!district) {
      throw new ApiError(404, "DISTRICT_NOT_FOUND", `No existe un distrito con id ${districtId}.`, {
        district_id: districtId,
      });
    }
    return district;
  }

  getYears(): number[] {
    const years = new Set<number>();
    for (const district of this.getDataset().districts) {
      for (const point of district.series) years.add(point.year);
    }
    return [...years].sort((a, b) => a - b);
  }

  getLastDataYear(): number | null {
    const years = this.getYears();
    return years.length > 0 ? years[years.length - 1] : null;
  }

  getSeriesPoint(district: DistrictData, year: number | null): DistrictSeriesPoint | null {
    if (year !== null) return district.series.find((point) => point.year === year) ?? null;
    if (district.latest_year !== null) {
      return district.series.find((point) => point.year === district.latest_year) ?? null;
    }
    return district.series.at(-1) ?? null;
  }

  getDistrictYearRecords(): Map<string, DistrictYearRecord> {
    const file = readCached<DistrictYearFile>(path.join(DATA_PROCESSED_DIR, "district_year.json"), this.jsonCache as Map<string, CacheEntry<DistrictYearFile>>);
    const map = new Map<string, DistrictYearRecord>();
    if (file?.records) {
      for (const record of file.records) map.set(`${record.district_id}-${record.year}`, record);
      return map;
    }
    for (const district of this.getDataset().districts) {
      for (const point of district.series) {
        map.set(`${district.district_id}-${point.year}`, {
          district_id: district.district_id,
          year: point.year,
          ndvi_mean: point.ndvi_mean,
          ndvi_valid_observation_count: null,
          ndvi_valid_pixel_fraction: null,
          lst_mean_celsius: point.lst_mean_celsius,
          lst_valid_pixel_fraction: null,
          environmental_index: point.environmental_index,
          socioenvironmental_index: point.socioenvironmental_index,
          index_without_territorial: point.index_without_territorial,
          territorial_reference_year: district.territorial_reference_year,
          equipment_access_index: district.equipment.equipment_access_index,
          mobility_access_index: district.equipment.mobility_access_index,
          data_quality_flag: point.data_quality_flag,
          source_refs: district.source_refs,
        });
      }
    }
    return map;
  }

  getSources(): SourceMetadata[] {
    const file = readCached<SourcesFile>(
      path.join(DATA_METADATA_DIR, "sources.json"),
      this.jsonCache as Map<string, CacheEntry<SourcesFile>>,
    );
    const sources = file?.sources?.length ? [...file.sources] : [];
    const ids = new Set(sources.map((source) => source.id));
    const dataMode = this.getDataMode();
    for (const source of DEFAULT_SOURCES) {
      if (source.id === "mock" && dataMode !== "mock") continue;
      if (!ids.has(source.id)) {
        sources.push(source);
        ids.add(source.id);
      }
    }
    return sources;
  }

  getSource(sourceRef: string): SourceMetadata {
    return this.getSources().find((source) => source.id === sourceRef) ?? {
      id: sourceRef,
      name: sourceRef,
      organization: "GeoQocha",
      url: "",
      reference_date: null,
      license: null,
      transformations: [],
      limitations: [],
    };
  }

  getMethodology(): {
    version: string;
    index: {
      name: string;
      scale: [number, number];
      views: string[];
      formula: string;
      weights: Record<string, number>;
      temporal_policy: Record<string, unknown>;
      sensitivity: Record<string, unknown>;
      normalization: string;
      missing_data_policy: string;
      classification: Array<{ range: [number, number]; label: string }>;
    };
    disclaimer: string;
  } {
    const file = readCached<MethodFile>(
      path.join(DATA_PROCESSED_DIR, "index.json"),
      this.jsonCache as Map<string, CacheEntry<MethodFile>>,
    );
    const dataset = this.getDataset();
    const referenceYears = dataset.districts
      .map((district) => district.territorial_reference_year)
      .filter((year): year is number => typeof year === "number");
    const referenceYear = referenceYears.length > 0 ? referenceYears[0] : null;

    return {
      version: file?.methodology_version ?? METHODOLOGY_VERSION,
      index: {
        name: "Índice de Calidad de Vida Socio-Ambiental (ICVSA)",
        scale: [1, 100],
        views: ["numeric", "semaphore"],
        formula:
          "ICVSA(d,t) = 0.35*S_ndvi(d,t) + 0.35*S_lst(d,t) + 0.20*S_equipment(d,t_ref) + 0.10*S_mobility(d,t_ref)",
        weights: {
          vegetation: WEIGHTS.vegetation,
          surface_temperature: WEIGHTS.surface_temperature,
          urban_equipment: WEIGHTS.urban_equipment,
          mobility: WEIGHTS.mobility,
        },
        temporal_policy: {
          environmental: "annual",
          territorial: "fixed_at_reference_year",
          territorial_reference_year: referenceYear,
          interpolation_allowed: false,
        },
        sensitivity: {
          field: "index_without_territorial",
          description: "ICVSA calculado solo con NDVI y LST.",
        },
        normalization: "Min-max fijo sobre el periodo de comparación, con referencia documentada.",
        missing_data_policy: "Excluir del cálculo e informar cobertura; nunca imputar cero.",
        classification: [
          { range: [70, 100], label: "Condición relativa favorable" },
          { range: [40, 69], label: "Condición intermedia" },
          { range: [1, 39], label: "Condición de atención" },
        ],
      },
      disclaimer: "Indicador sintético de apoyo al análisis; no mide bienestar de forma definitiva.",
    };
  }

  getDataMode(): "mock" | "real" {
    return this.getDataset().data_status === "illustrative" ? "mock" : "real";
  }

  getHeatmapRaster(year: number): {
    raster_url: string;
    bbox: number[];
    attribution: string;
  } | null {
    const file = readCached<HeatmapFile>(
      path.join(DATA_PROCESSED_DIR, "heatmap_lst.json"),
      this.jsonCache as Map<string, CacheEntry<HeatmapFile>>,
    );
    if (!file) return null;
    const rasterUrl = file.raster_urls?.[String(year)];
    if (!rasterUrl) return null;
    return {
      raster_url: rasterUrl,
      bbox: Array.isArray(file.bbox) ? file.bbox : [],
      attribution: file.attribution ?? "NASA MODIS MOD11A2 / GAMC",
    };
  }

  getRasterPath(year: number, variable: string): string | null {
    if (variable !== "lst") return null;
    const raster = this.getHeatmapRaster(year);
    if (!raster) return null;
    return path.join(DATA_PROCESSED_DIR, `heatmap_lst_${year}.png`);
  }
}

export const store = new DatasetStore();
