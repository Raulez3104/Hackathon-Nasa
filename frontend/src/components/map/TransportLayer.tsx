import { useEffect, useMemo, useState } from "react";
import { CircleMarker, GeoJSON, useMapEvents } from "react-leaflet";
import type { Feature, FeatureCollection, GeoJsonObject, LineString, Point } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import type { DistrictGeometry } from "../../../../shared/types/geoqocha";

type TransportProperties = {
  route_group?: string;
  route_file?: string;
  route_id?: string;
  route_name?: string;
  route_type?: string;
  color?: string | null;
  direction?: string | null;
  origin?: string | null;
  destination?: string | null;
  stop_id?: string;
  name?: string;
  routes?: string[];
  boarding_recommended?: boolean;
  safety_score?: number | null;
  notes?: string | null;
  data_status?: string;
};

type TransportFeature = Feature<LineString | Point, TransportProperties>;
type TransportCollection = FeatureCollection<LineString | Point, TransportProperties>;

interface TransportLayerProps {
  routeId: string;
  showStops: boolean;
  districtGeometry: DistrictGeometry | null;
  onRoutesLoaded: (routes: string[]) => void;
  onStatusChange: (status: "loading" | "ready" | "error") => void;
}

export function TransportLayer({
  routeId,
  showStops,
  districtGeometry,
  onRoutesLoaded,
  onStatusChange,
}: TransportLayerProps) {
  const [data, setData] = useState<TransportCollection | null>(null);
  const [zoom, setZoom] = useState(12);
  const map = useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    let cancelled = false;
    onStatusChange("loading");
    fetch("/data/transport.geojson")
      .then((response) => {
        if (!response.ok) throw new Error(`Transporte ${response.status}`);
        return response.json() as Promise<TransportCollection>;
      })
      .then((collection) => {
        if (cancelled) return;
        const routes = [...new Set(
          collection.features
            .filter((feature) => feature.geometry.type === "LineString")
            .map((feature) => feature.properties?.route_group)
            .filter((value): value is string => Boolean(value)),
        )].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
        setData(collection);
        onRoutesLoaded(routes);
        onStatusChange("ready");
      })
      .catch(() => {
        if (!cancelled) onStatusChange("error");
      });

    return () => {
      cancelled = true;
    };
  }, [onRoutesLoaded, onStatusChange]);

  const filtered = useMemo<{
    lines: Feature<LineString, TransportProperties>[];
    stops: Feature<Point, TransportProperties>[];
  }>(() => {
    if (!data) return { lines: [], stops: [] };
    const features = data.features.filter((feature) => {
      const properties = feature.properties ?? {};
      if (!routeId) return true;
      if (feature.geometry.type === "LineString") return properties.route_group === routeId;
      return properties.routes?.includes(routeId) ?? false;
    });
    return {
      lines: features.filter((feature): feature is Feature<LineString, TransportProperties> => feature.geometry.type === "LineString"),
      stops: features.filter((feature): feature is Feature<Point, TransportProperties> => feature.geometry.type === "Point"),
    };
  }, [data, routeId]);

  const visibleLines = useMemo(
    () => filtered.lines.filter((feature) => matchesDistrict(feature, districtGeometry)),
    [districtGeometry, filtered.lines],
  );
  const visibleStops = useMemo(
    () => filtered.stops.filter((feature) => matchesDistrict(feature, districtGeometry)),
    [districtGeometry, filtered.stops],
  );

  if (!data) return null;

  return (
    <>
      <GeoJSON
        key={`transport-lines-${routeId}-${districtGeometry ? "district" : "all"}`}
        data={{ type: "FeatureCollection", features: visibleLines } as GeoJsonObject}
        style={(feature) => routeStyle(feature?.properties as TransportProperties | undefined)}
        onEachFeature={(feature, layer) => bindRoutePopup(feature as TransportFeature, layer)}
      />
      {showStops && zoom >= 14 && visibleStops.map((feature) => (
        <TransportStop key={feature.properties?.stop_id ?? `${feature.geometry.coordinates.join("-")}`} feature={feature} />
      ))}
    </>
  );
}

function TransportStop({ feature }: { feature: Feature<Point, TransportProperties> }) {
  const [longitude, latitude] = feature.geometry.coordinates;
  const properties = feature.properties ?? {};
  return (
    <CircleMarker
      center={[latitude, longitude]}
      radius={4}
      pathOptions={{ color: "#7a4f2b", weight: 1, fillColor: "#f0b44d", fillOpacity: 0.9 }}
      eventHandlers={{
        click: (event) => {
          event.originalEvent.stopPropagation();
          event.target.bindPopup(
            `<strong>${escapeHtml(properties.name ?? "Parada propuesta")}</strong>` +
            `<br>Rutas: ${escapeHtml((properties.routes ?? []).join(", ") || "no disponible")}` +
            `<br>Estado: × no recomendada; punto ilustrativo` +
            `<br><em>Parada propuesta ilustrativa; no oficial ni calificada como segura.</em>`,
          ).openPopup();
        },
      }}
    />
  );
}

function routeStyle(properties: TransportProperties | undefined): PathOptions {
  const color = properties?.color;
  return {
    color: color && /^#[0-9a-f]{6}$/i.test(color) ? color : "#7a4f2b",
    weight: 3,
    opacity: 0.75,
  };
}

function bindRoutePopup(feature: TransportFeature, layer: Layer): void {
  if (feature.geometry.type !== "LineString") return;
  const properties = feature.properties ?? {};
  layer.bindPopup(
    `<strong>${escapeHtml(properties.route_name ?? properties.route_group ?? "Ruta")}</strong>` +
    `<br>Identificador: ${escapeHtml(properties.route_id ?? "no disponible")}` +
    `<br>Origen: ${escapeHtml(properties.origin ?? "no disponible")}` +
    `<br>Destino: ${escapeHtml(properties.destination ?? "no disponible")}` +
    `<br><em>Fuente de ruta incorporada al proyecto.</em>`,
  );
}

function matchesDistrict(
  feature: TransportFeature,
  districtGeometry: DistrictGeometry | null,
): boolean {
  if (!districtGeometry) return true;
  const coordinates = feature.geometry.type === "Point"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates.filter((_, index) => index % Math.max(1, Math.floor(feature.geometry.coordinates.length / 20)) === 0);
  return coordinates.some(([longitude, latitude]) => pointInPolygon(longitude, latitude, districtGeometry.coordinates[0]));
}

function pointInPolygon(longitude: number, latitude: number, polygon: number[][]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [currentLongitude, currentLatitude] = polygon[index];
    const [previousLongitude, previousLatitude] = polygon[previous];
    const intersects = ((currentLatitude > latitude) !== (previousLatitude > latitude))
      && longitude < (previousLongitude - currentLongitude) * (latitude - currentLatitude)
      / (previousLatitude - currentLatitude) + currentLongitude;
    if (intersects) inside = !inside;
  }
  return inside;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "no disponible")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
