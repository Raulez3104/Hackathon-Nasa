import type { DistrictData } from "../../../../shared/types/geoqocha";
import { formatValue, getValue } from "./color-scales";

interface MapComparisonControlProps {
  districts: DistrictData[];
  ids: number[];
  year: number;
  variable: Parameters<typeof getValue>[2];
  onChange: (ids: number[]) => void;
}

export function MapComparisonControl({ districts, ids, year, variable, onChange }: MapComparisonControlProps) {
  const leftId = ids[0] ?? null;
  const rightId = ids[1] ?? null;
  const update = (side: 0 | 1, value: string) => {
    const next = value ? Number(value) : null;
    const result = [...ids];
    result[side] = Number.isInteger(next) ? next as number : 0;
    onChange(result.filter((id) => id > 0));
  };
  const left = districts.find((district) => district.district_id === leftId);
  const right = districts.find((district) => district.district_id === rightId);

  return (
    <section className="dashboard-comparison-control" aria-label="Comparación de distritos">
      <strong>Comparar distritos</strong>
      <div className="dashboard-comparison-fields">
        <label>
          <span>Distrito A</span>
          <select value={leftId ?? ""} onChange={(event) => update(0, event.target.value)}>
            <option value="">Selecciona…</option>
            {districts.map((district) => <option key={district.district_id} value={district.district_id}>{district.name}</option>)}
          </select>
        </label>
        <label>
          <span>Distrito B</span>
          <select value={rightId ?? ""} onChange={(event) => update(1, event.target.value)}>
            <option value="">Selecciona…</option>
            {districts.map((district) => <option key={district.district_id} value={district.district_id}>{district.name}</option>)}
          </select>
        </label>
      </div>
      {left && right ? (
        <p className="dashboard-comparison-result">
          {left.name}: {formatValue(getValue(left, year, variable), variable)}
          <br />
          {right.name}: {formatValue(getValue(right, year, variable), variable)}
        </p>
      ) : (
        <p className="dashboard-layer-help">Selecciona dos distritos para comparar sus valores.</p>
      )}
    </section>
  );
}
