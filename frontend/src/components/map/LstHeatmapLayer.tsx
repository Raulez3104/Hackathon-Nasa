import { CircleMarker, Tooltip } from "react-leaflet";
import type { DistrictData } from "../../../../shared/types/geoqocha";
import { getSeriesPoint } from "./color-scales";

interface LstHeatmapLayerProps {
  districts: DistrictData[];
  year: number;
}

export function LstHeatmapLayer({ districts, year }: LstHeatmapLayerProps) {
  return (
    <>
      {districts.map((district) => {
        const point = getSeriesPoint(district, year);
        const coordinates = district.geometry?.coordinates[0] ?? [];
        if (!point?.lst_mean_celsius || coordinates.length === 0) return null;
        const center = coordinates.reduce(
          (accumulator, [longitude, latitude]) => [accumulator[0] + longitude / coordinates.length, accumulator[1] + latitude / coordinates.length],
          [0, 0],
        );
        const intensity = Math.max(0, Math.min(1, (point.lst_mean_celsius - 24) / 12));
        return (
          <CircleMarker
            key={`lst-${district.district_id}`}
            center={[center[1], center[0]]}
            radius={14 + intensity * 14}
            pathOptions={{ color: "#d7191c", weight: 0, fillColor: "#fdae61", fillOpacity: 0.12 + intensity * 0.2 }}
          >
            <Tooltip>{district.name}: {point.lst_mean_celsius.toFixed(1)} °C</Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
