import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, WMSTileLayer } from "react-leaflet";
import { CRS, type LatLngBoundsExpression, type Map as LeafletMap, type WMSParams } from "leaflet";
import type { DistrictData, Variable } from "../../../../shared/types/geoqocha";
import { DistrictLayer } from "./DistrictLayer";
import { LstHeatmapLayer } from "./LstHeatmapLayer";
import type { IndexView, WmsLayerStatus } from "./map.types";
import { requestWms } from "../../services/wms/client";
import type { GamcLayerDefinition } from "../../services/wms/catalog";

interface MapShellProps {
  districts: DistrictData[];
  year: number;
  variable: Variable;
  indexView: IndexView;
  selectedDistrictId: number | null;
  showLstHeatmap: boolean;
  gamcLayers: readonly GamcLayerDefinition[];
  gamcOpacity: number;
  gamcReloadToken: number;
  onDistrictSelect: (districtId: number) => void;
  onGamcStatusChange: (layerId: string, status: WmsLayerStatus) => void;
}

interface FeatureCollection {
  features?: Array<{ properties?: Record<string, unknown> }>;
}

const COCHABAMBA_BOUNDS: LatLngBoundsExpression = [
  [-17.52, -66.27],
  [-17.31, -66.05],
];

export function MapShell(props: MapShellProps) {
  return (
    <div className="dashboard-map" aria-label="Mapa interactivo de los 15 distritos municipales de Cochabamba">
      <MapContainer
        center={[-17.39, -66.16]}
        zoom={12}
        minZoom={10}
        maxZoom={17}
        maxBounds={COCHABAMBA_BOUNDS}
        preferCanvas
        className="map-canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds />
        <DistrictLayer {...props} />
        {props.showLstHeatmap && <LstHeatmapLayer districts={props.districts} year={props.year} />}
        {props.gamcLayers.map((layer) => (
          <GamcWmsLayer
            key={`${layer.id}-${props.gamcReloadToken}`}
            layer={layer}
            opacity={props.gamcOpacity * layer.defaultOpacity}
            onStatusChange={props.onGamcStatusChange}
          />
        ))}
        <GamcFeatureInfo layers={props.gamcLayers.filter((layer) => layer.supportsFeatureInfo)} />
      </MapContainer>
    </div>
  );
}

interface GamcWmsLayerProps {
  layer: GamcLayerDefinition;
  opacity: number;
  onStatusChange: (layerId: string, status: WmsLayerStatus) => void;
}

function GamcWmsLayer({ layer, opacity, onStatusChange }: GamcWmsLayerProps) {
  useEffect(() => {
    onStatusChange(layer.id, "idle");
  }, [layer.id, onStatusChange]);

  return (
    <WMSTileLayer
      url={`${import.meta.env.VITE_API_BASE_URL ?? ""}/api/gamc/wms`}
      layers=""
      params={{ service_id: layer.id } as unknown as WMSParams}
      format="image/png"
      transparent
      version="1.1.1"
      minZoom={layer.minZoom}
      maxZoom={19}
      opacity={opacity}
      uppercase={false}
      attribution="Fuente: Gobierno Autónomo Municipal de Cochabamba"
      eventHandlers={{
        loading: () => onStatusChange(layer.id, "loading"),
        load: () => onStatusChange(layer.id, "ready"),
        tileerror: () => onStatusChange(layer.id, "error"),
      }}
    />
  );
}

function GamcFeatureInfo({ layers }: { layers: readonly GamcLayerDefinition[] }) {
  const map = useMap();
  useMapEvents({
    click: async (event) => {
      if (layers.length === 0) return;
      const results = await Promise.all(layers.map(async (layer) => ({
        layer,
        features: await queryFeatures(map, layer.id, event.containerPoint.x, event.containerPoint.y).catch(() => null),
      })));

      const sections = results
        .filter((result) => result.features && result.features.length > 0)
        .map((result) => {
          const properties = result.features?.[0]?.properties ?? {};
          const rows = Object.entries(properties)
            .slice(0, 8)
            .map(([key, value]) => `<div><strong>${escapeHtml(key)}:</strong> ${escapeHtml(formatValue(value))}</div>`)
            .join("");
          return `<div class="gamc-popup-section"><strong>${escapeHtml(result.layer.name)}</strong>${rows}</div>`;
        });

      if (sections.length === 0) {
        map.openPopup("No se encontraron elementos municipales en este punto.", event.latlng);
        return;
      }

      map.openPopup(sections.join(""), event.latlng, { maxWidth: 320 });
    },
  });
  return null;
}

async function queryFeatures(
  map: LeafletMap,
  serviceId: string,
  containerX: number,
  containerY: number,
): Promise<FeatureCollection["features"] | null> {
  const bounds = map.getBounds();
  const crs = map.options.crs ?? CRS.EPSG3857;
  const southWest = crs.project(bounds.getSouthWest());
  const northEast = crs.project(bounds.getNorthEast());
  const size = map.getSize();

  const response = await requestWms({
    serviceId,
    operation: "GetFeatureInfo",
    version: "1.1.1",
    srs: "EPSG:3857",
    bbox: [southWest.x, southWest.y, northEast.x, northEast.y],
    width: size.x,
    height: size.y,
    x: Math.max(0, Math.min(size.x - 1, Math.round(containerX))),
    y: Math.max(0, Math.min(size.y - 1, Math.round(containerY))),
    infoFormat: "application/json",
    featureCount: 5,
  });
  const payload = (await response.json()) as FeatureCollection;
  return payload.features ?? null;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "no disponible";
  return String(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function MapBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(COCHABAMBA_BOUNDS, { padding: [16, 16] });
  }, [map]);
  return null;
}
