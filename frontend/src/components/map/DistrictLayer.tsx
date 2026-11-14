import { Polygon, Tooltip } from "react-leaflet";
import type { DistrictData, Variable } from "../../../../shared/types/geoqocha";
import { districtColor, formatValue, getValue } from "./color-scales";
import type { IndexView } from "./map.types";

interface DistrictLayerProps {
  districts: DistrictData[];
  year: number;
  variable: Variable;
  indexView: IndexView;
  selectedDistrictId: number | null;
  onDistrictSelect: (districtId: number) => void;
}

export function DistrictLayer({
  districts,
  year,
  variable,
  indexView,
  selectedDistrictId,
  onDistrictSelect,
}: DistrictLayerProps) {
  return (
    <>
      {districts.map((district) => {
        const isSelected = district.district_id === selectedDistrictId;
        const positions = district.geometry?.coordinates[0].map(([longitude, latitude]) => [latitude, longitude] as [number, number]) ?? [];
        return (
          <Polygon
            key={district.district_id}
            positions={positions}
            pathOptions={{
              color: isSelected ? "#102f2b" : "#ffffff",
              weight: isSelected ? 3 : 1,
              fillColor: districtColor(district, year, variable, indexView),
              fillOpacity: isSelected ? 0.9 : 0.72,
            }}
            eventHandlers={{ click: () => onDistrictSelect(district.district_id) }}
          >
            <Tooltip sticky>
              <strong>{district.name}</strong>
              <br />
              {formatValue(getValue(district, year, variable), variable)}
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
