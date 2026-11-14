export type WmsOperation = "GetMap" | "GetLegendGraphic" | "GetFeatureInfo";

export interface WmsRequest {
  serviceId: string;
  operation: WmsOperation;
  version?: "1.1.1" | "1.0.0";
  layers?: string;
  format?: "image/png";
  transparent?: boolean;
  srs?: "EPSG:3857";
  bbox?: [number, number, number, number];
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  queryLayers?: string;
  infoFormat?: "application/json";
  featureCount?: number;
}

export interface WmsError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function buildWmsUrl(request: WmsRequest): string {
  const params = new URLSearchParams({
    service_id: request.serviceId,
    REQUEST: request.operation,
  });
  set(params, "VERSION", request.version);
  set(params, "LAYERS", request.layers);
  set(params, "FORMAT", request.format);
  set(params, "TRANSPARENT", request.transparent === undefined ? undefined : String(request.transparent));
  set(params, "SRS", request.srs);
  set(params, "BBOX", request.bbox?.join(","));
  set(params, "WIDTH", request.width?.toString());
  set(params, "HEIGHT", request.height?.toString());
  set(params, "X", request.x?.toString());
  set(params, "Y", request.y?.toString());
  set(params, "QUERY_LAYERS", request.queryLayers);
  set(params, "INFO_FORMAT", request.infoFormat);
  set(params, "FEATURE_COUNT", request.featureCount?.toString());
  return `${API_BASE_URL}/api/gamc/wms?${params.toString()}`;
}

export async function requestWms(request: WmsRequest, init?: RequestInit): Promise<Response> {
  const response = await fetch(buildWmsUrl(request), init);
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as WmsError | null;
    throw new Error(payload?.error.message ?? `Error WMS ${response.status}`);
  }
  return response;
}

function set(params: URLSearchParams, name: string, value: string | undefined): void {
  if (value !== undefined) params.set(name, value);
}
