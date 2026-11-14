import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, WMSTileLayer } from "react-leaflet";
import { CRS, type LatLngBoundsExpression, type WMSParams } from "leaflet";
import type { DistrictData, Variable } from "../../../../shared/types/geoqocha";
import { DistrictLayer } from "./DistrictLayer";
import { LstHeatmapLayer } from "./LstHeatmapLayer";
import type { IndexView } from "./map.types";
import { requestWms } from "../../services/wms/client";

interface MapShellProps {
  districts: DistrictData[];
  year: number;
  variable: Variable;
  indexView: IndexView;
  selectedDistrictId: number | null;
  showLstHeatmap: boolean;
  showGamcEquipment: boolean;
  onDistrictSelect: (districtId: number) => void;
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
        {props.showGamcEquipment && (
          <>
            <GamcEquipmentLayer />
            <GamcFeatureInfo />
          </>
        )}
      </MapContainer>
    </div>
  );
}

function GamcFeatureInfo() {
  const serviceId = import.meta.env.VITE_GAMC_EQUIPMENT_SERVICE_ID;
  const map = useMapEvents({
    click: async (event) => {
      if (!serviceId) return;
      const bounds = map.getBounds();
      const crs = map.options.crs ?? CRS.EPSG3857;
      const southWest = crs.project(bounds.getSouthWest());
      const northEast = crs.project(bounds.getNorthEast());
      const size = map.getSize();
      const features = await requestWms({
        serviceId,
        operation: "GetFeatureInfo",
        version: "1.1.1",
        srs: "EPSG:3857",
        bbox: [southWest.x, southWest.y, northEast.x, northEast.y],
        width: size.x,
        height: size.y,
        x: Math.max(0, Math.min(size.x - 1, Math.round(event.containerPoint.x))),
        y: Math.max(0, Math.min(size.y - 1, Math.round(event.containerPoint.y))),
        infoFormat: "application/json",
        featureCount: 5,
      })
        .then((response) => response.json() as Promise<{ features?: Array<{ properties?: Record<string, unknown> }> }>)
        .catch(() => null);

      if (!features?.features?.length) {
        map.openPopup("No se encontraron elementos municipales en este punto.", event.latlng);
        return;
      }

      const properties = features.features[0].properties ?? {};
      const content = Object.entries(properties)
        .map(([key, value]) => `${key}: ${String(value ?? "no disponible")}`)
        .join("<br>");
      map.openPopup(content, event.latlng);
    },
  });
  return null;
}

function GamcEquipmentLayer() {
  const serviceId = import.meta.env.VITE_GAMC_EQUIPMENT_SERVICE_ID;
  if (!serviceId) return null;
  return (
    <WMSTileLayer
      url={`${import.meta.env.VITE_API_BASE_URL ?? ""}/api/gamc/wms`}
      layers=""
      params={{ service_id: serviceId } as unknown as WMSParams}
      format="image/png"
      transparent
      version="1.1.1"
      minZoom={12}
      maxZoom={19}
      opacity={0.82}
      uppercase={false}
      attribution="Fuente: Gobierno Autónomo Municipal de Cochabamba"
    />
  );
}

function MapBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(COCHABAMBA_BOUNDS, { padding: [16, 16] });
  }, [map]);
  return null;
}
