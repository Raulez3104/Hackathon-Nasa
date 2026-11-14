import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { DistrictData, Variable } from "../../../../shared/types/geoqocha";
import { DistrictLayer } from "./DistrictLayer";
import { LstHeatmapLayer } from "./LstHeatmapLayer";
import type { IndexView } from "./map.types";

interface MapShellProps {
  districts: DistrictData[];
  year: number;
  variable: Variable;
  indexView: IndexView;
  selectedDistrictId: number | null;
  showLstHeatmap: boolean;
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
      </MapContainer>
    </div>
  );
}

function MapBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(COCHABAMBA_BOUNDS, { padding: [16, 16] });
  }, [map]);
  return null;
}
