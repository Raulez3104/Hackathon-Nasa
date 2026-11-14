import type { Request } from "express";
import "../config/env.js";

export type WmsOperation = "GetMap" | "GetLegendGraphic" | "GetFeatureInfo";

export interface WmsQuery {
  serviceId: string;
  operation: WmsOperation;
  version: "1.1.1" | "1.0.0";
  layers?: string;
  format?: string;
  transparent?: "true" | "false";
  srs?: string;
  bbox?: [number, number, number, number];
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  queryLayers?: string;
  infoFormat?: string;
  featureCount?: number;
}

export interface WmsConfig {
  upstreamUrl: string;
  apiKey: string;
  allowedServiceIds: Set<string>;
  timeoutMs: number;
  rateLimitPerMinute: number;
}

const OPERATIONS: WmsOperation[] = ["GetMap", "GetLegendGraphic", "GetFeatureInfo"];
const IMAGE_FORMATS = new Set(["image/png"]);
const INFO_FORMATS = new Set(["application/json"]);

export function readWmsConfig(env: NodeJS.ProcessEnv = process.env): WmsConfig {
  return {
    upstreamUrl: env.GAMC_WMS_URL ?? "",
    apiKey: env.GAMC_API_KEY ?? "",
    allowedServiceIds: new Set((env.GAMC_ALLOWED_SERVICE_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean)),
    timeoutMs: boundedInteger(env.GAMC_WMS_TIMEOUT_MS, 10_000, 1_000, 30_000),
    rateLimitPerMinute: boundedInteger(env.GAMC_WMS_RATE_LIMIT, 60, 1, 600),
  };
}

export function parseWmsQuery(request: Request, config: WmsConfig): WmsQuery {
  const serviceId = requiredString(queryValue(request, "service_id"), "service_id");
  if (!config.allowedServiceIds.has(serviceId)) {
    throw new WmsValidationError(403, "SERVICE_NOT_ALLOWED", "El service_id no está autorizado.");
  }

  const operation = requiredString(queryValue(request, "REQUEST"), "REQUEST");
  if (!OPERATIONS.includes(operation as WmsOperation)) {
    throw new WmsValidationError(403, "OPERATION_NOT_ALLOWED", "La operación WMS no está permitida.");
  }

  const selectedOperation = operation as WmsOperation;
  const requestedVersion = queryValue(request, "VERSION");
  const version = requestedVersion === undefined
    ? selectedOperation === "GetLegendGraphic" ? "1.0.0" : "1.1.1"
    : oneOf(requestedVersion, ["1.1.1", "1.0.0"], "VERSION") as WmsQuery["version"];

  if (selectedOperation !== "GetLegendGraphic" && version !== "1.1.1") {
    invalid("VERSION", "Los mapas y consultas requieren WMS 1.1.1.");
  }

  const query: WmsQuery = {
    serviceId,
    operation: selectedOperation,
    version,
    layers: optionalString(queryValue(request, "LAYERS"), "LAYERS"),
    format: optionalString(queryValue(request, "FORMAT"), "FORMAT"),
    transparent: optionalBoolean(queryValue(request, "TRANSPARENT")),
    srs: optionalString(queryValue(request, "SRS"), "SRS"),
    bbox: optionalBbox(queryValue(request, "BBOX")),
    width: optionalDimension(queryValue(request, "WIDTH"), "WIDTH"),
    height: optionalDimension(queryValue(request, "HEIGHT"), "HEIGHT"),
    x: optionalCoordinate(queryValue(request, "X"), "X", queryValue(request, "WIDTH")),
    y: optionalCoordinate(queryValue(request, "Y"), "Y", queryValue(request, "HEIGHT")),
    queryLayers: optionalString(queryValue(request, "QUERY_LAYERS"), "QUERY_LAYERS"),
    infoFormat: optionalInfoFormat(queryValue(request, "INFO_FORMAT")),
    featureCount: optionalFeatureCount(queryValue(request, "FEATURE_COUNT")),
  };

  validateOperationRequirements(query);
  return query;
}

export function toUpstreamParams(query: WmsQuery, config: WmsConfig): URLSearchParams {
  const params = new URLSearchParams({
    service_id: query.serviceId,
    SERVICE: "WMS",
    VERSION: query.version,
    REQUEST: query.operation,
  });

  addIfDefined(params, "LAYERS", query.layers);
  addIfDefined(params, "FORMAT", query.format);
  addIfDefined(params, "TRANSPARENT", query.transparent);
  addIfDefined(params, "SRS", query.srs);
  addIfDefined(params, "BBOX", query.bbox?.join(","));
  addIfDefined(params, "WIDTH", query.width?.toString());
  addIfDefined(params, "HEIGHT", query.height?.toString());
  addIfDefined(params, "X", query.x?.toString());
  addIfDefined(params, "Y", query.y?.toString());
  addIfDefined(params, "QUERY_LAYERS", query.queryLayers);
  addIfDefined(params, "INFO_FORMAT", query.infoFormat);
  addIfDefined(params, "FEATURE_COUNT", query.featureCount?.toString());
  if (config.apiKey) params.set("key", config.apiKey);
  return params;
}

export function cacheTtlMs(query: WmsQuery): number {
  if (query.operation === "GetLegendGraphic") return 24 * 60 * 60 * 1000;
  if (query.operation === "GetFeatureInfo") return 60 * 1000;
  return 6 * 60 * 60 * 1000;
}

export class WmsValidationError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: "INVALID_PARAMETER" | "SERVICE_NOT_ALLOWED" | "OPERATION_NOT_ALLOWED" | "RATE_LIMITED",
    message: string,
  ) {
    super(message);
    this.name = "WmsValidationError";
  }
}

function validateOperationRequirements(query: WmsQuery): void {
  if (query.operation === "GetMap") {
    if (!query.format || !IMAGE_FORMATS.has(query.format)) invalid("FORMAT", "GetMap solo acepta image/png.");
    if (!query.srs || query.srs !== "EPSG:3857") invalid("SRS", "GetMap requiere SRS EPSG:3857.");
    if (!query.bbox || query.width === undefined || query.height === undefined) {
      invalid("BBOX/WIDTH/HEIGHT", "GetMap requiere BBOX, WIDTH y HEIGHT.");
    }
  }

  if (query.operation === "GetFeatureInfo") {
    if (!query.srs || query.srs !== "EPSG:3857") invalid("SRS", "GetFeatureInfo requiere SRS EPSG:3857.");
    if (!query.bbox || query.width === undefined || query.height === undefined || query.x === undefined || query.y === undefined) {
      invalid("BBOX/WIDTH/HEIGHT/X/Y", "GetFeatureInfo requiere BBOX, WIDTH, HEIGHT, X e Y.");
    }
  }
}

function requiredString(value: unknown, name: string): string {
  const result = optionalString(value, name);
  if (!result) invalid(name, `Falta el parámetro ${name}.`);
  return result;
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > 512) invalid(name, `El parámetro ${name} no es válido.`);
  return value;
}

function oneOf(value: unknown, allowed: string[], name: string): string {
  const result = optionalString(value, name);
  if (!result || !allowed.includes(result)) invalid(name, `El parámetro ${name} no es válido.`);
  return result;
}

function optionalBoolean(value: unknown): "true" | "false" | undefined {
  if (value === undefined) return undefined;
  if (value !== "true" && value !== "false") invalid("TRANSPARENT", "TRANSPARENT debe ser true o false.");
  return value;
}

function optionalBbox(value: unknown): [number, number, number, number] | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") invalid("BBOX", "BBOX debe tener cuatro números.");
  const numbers = value.split(",").map(Number);
  if (numbers.length !== 4 || numbers.some((number) => !Number.isFinite(number))) invalid("BBOX", "BBOX debe tener cuatro números finitos.");
  if (numbers[0] >= numbers[2] || numbers[1] >= numbers[3]) invalid("BBOX", "BBOX debe estar ordenado como minX,minY,maxX,maxY.");
  return numbers as [number, number, number, number];
}

function optionalDimension(value: unknown, name: string): number | undefined {
  if (value === undefined) return undefined;
  const number = integer(value, name);
  if (number < 1 || number > 2048) invalid(name, `${name} debe estar entre 1 y 2048.`);
  return number;
}

function optionalCoordinate(value: unknown, name: string, dimension: unknown): number | undefined {
  if (value === undefined) return undefined;
  const number = integer(value, name);
  const max = dimension === undefined ? undefined : integer(dimension, name === "X" ? "WIDTH" : "HEIGHT");
  if (max !== undefined && (number < 0 || number >= max)) invalid(name, `${name} debe estar dentro de la imagen.`);
  return number;
}

function optionalInfoFormat(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  const result = optionalString(value, "INFO_FORMAT");
  if (result && !INFO_FORMATS.has(result)) invalid("INFO_FORMAT", "INFO_FORMAT no está soportado.");
  return result;
}

function optionalFeatureCount(value: unknown): number | undefined {
  if (value === undefined || value === "") return undefined;
  const result = integer(value, "FEATURE_COUNT");
  if (result < 1 || result > 20) invalid("FEATURE_COUNT", "FEATURE_COUNT debe estar entre 1 y 20.");
  return result;
}

function queryValue(request: Request, name: string): unknown {
  const target = name.toLowerCase();
  const key = Object.keys(request.query).find((candidate) => candidate.toLowerCase() === target);
  return key === undefined ? undefined : request.query[key];
}

function integer(value: unknown, name: string): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) invalid(name, `${name} debe ser un entero.`);
  return Number(value);
}

function invalid(name: string, message: string): never {
  throw new WmsValidationError(400, "INVALID_PARAMETER", `${name}: ${message}`);
}

function addIfDefined(params: URLSearchParams, name: string, value: string | undefined): void {
  if (value !== undefined) params.set(name, value);
}

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}
