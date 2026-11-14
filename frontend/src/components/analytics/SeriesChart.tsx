import { useId, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DistrictData, DistrictSeriesPoint } from "../../../../shared/types/geoqocha";
import { NOT_AVAILABLE, formatIndex, formatLst, formatNdvi, qualityLabel } from "./format";
import "./analytics.css";

type SeriesVariable = "ndvi" | "lst" | "icvsa";

interface VariableConfig {
  label: string;
  field: keyof Pick<DistrictSeriesPoint, "ndvi_mean" | "lst_mean_celsius" | "socioenvironmental_index">;
  format: (value: number | null | undefined) => string;
  domain: [number | string, number | string];
  unit: string;
  caveat: string;
}

const VARIABLES: Record<SeriesVariable, VariableConfig> = {
  ndvi: {
    label: "NDVI",
    field: "ndvi_mean",
    format: formatNdvi,
    domain: [-1, 1],
    unit: "índice",
    caveat: "NDVI aproxima el vigor vegetal; no mide directamente área deforestada.",
  },
  lst: {
    label: "LST",
    field: "lst_mean_celsius",
    format: formatLst,
    domain: ["auto", "auto"],
    unit: "°C",
    caveat: "LST es temperatura superficial, no temperatura del aire.",
  },
  icvsa: {
    label: "ICVSA",
    field: "socioenvironmental_index",
    format: formatIndex,
    domain: [0, 100],
    unit: "índice 1–100",
    caveat: "El ICVSA combina ambiente y territorio; no es una evaluación oficial del GAMC.",
  },
};

interface ChartRow {
  year: number;
  primary: number | null;
  secondary: number | null;
  quality: DistrictSeriesPoint["data_quality_flag"] | null;
  secondaryQuality: DistrictSeriesPoint["data_quality_flag"] | null;
}

function buildRows(
  primary: DistrictData,
  secondary: DistrictData | null,
  field: VariableConfig["field"],
): ChartRow[] {
  const years = new Set<number>();
  primary.series.forEach((point) => years.add(point.year));
  secondary?.series.forEach((point) => years.add(point.year));
  const primaryByYear = new Map(primary.series.map((point) => [point.year, point]));
  const secondaryByYear = new Map((secondary?.series ?? []).map((point) => [point.year, point]));

  return [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const primaryPoint = primaryByYear.get(year) ?? null;
      const secondaryPoint = secondaryByYear.get(year) ?? null;
      const primaryValue = primaryPoint ? primaryPoint[field] : null;
      const secondaryValue = secondaryPoint ? secondaryPoint[field] : null;
      return {
        year,
        primary: typeof primaryValue === "number" ? primaryValue : null,
        secondary: typeof secondaryValue === "number" ? secondaryValue : null,
        quality: primaryPoint?.data_quality_flag ?? null,
        secondaryQuality: secondaryPoint?.data_quality_flag ?? null,
      };
    });
}

export interface SeriesChartProps {
  primary: DistrictData;
  secondary?: DistrictData | null;
  year?: number | null;
  defaultVariable?: SeriesVariable;
}

export function SeriesChart({ primary, secondary = null, year = null, defaultVariable = "ndvi" }: SeriesChartProps) {
  const [variable, setVariable] = useState<SeriesVariable>(defaultVariable);
  const config = VARIABLES[variable];
  const rows = useMemo(() => buildRows(primary, secondary, config.field), [config.field, primary, secondary]);
  const tabsId = useId();

  const firstYear = rows[0]?.year ?? null;
  const lastYear = rows[rows.length - 1]?.year ?? null;
  const missingYears = rows.filter((row) => row.primary == null).map((row) => row.year);
  const chartLabel = `Serie de ${config.label} de ${primary.name}${
    secondary ? ` y ${secondary.name}` : ""
  }, ${firstYear ?? "sin año"} a ${lastYear ?? "sin año"}.`;

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const keys: SeriesVariable[] = ["ndvi", "lst", "icvsa"];
    const index = keys.indexOf(variable);
    const next = event.key === "ArrowRight" ? (index + 1) % keys.length : (index - 1 + keys.length) % keys.length;
    setVariable(keys[next]);
  };

  return (
    <section className="gq-series" aria-labelledby={`${tabsId}-title`}>
      <div className="gq-section-heading">
        <p className="gq-eyebrow">Serie histórica</p>
        <h4 id={`${tabsId}-title`}>
          {config.label} {firstYear != null && lastYear != null ? `${firstYear}–${lastYear}` : ""}
        </h4>
        <p>
          {primary.name}
          {secondary ? ` vs. ${secondary.name}` : ""}. {year != null ? `Año resaltado: ${year}.` : ""}
        </p>
      </div>

      <div className="gq-chart-tabs" role="tablist" aria-label="Variable de la serie histórica">
        {(Object.keys(VARIABLES) as SeriesVariable[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={variable === key}
            className={`gq-tab ${variable === key ? "is-active" : ""}`}
            onClick={() => setVariable(key)}
            onKeyDown={handleTabKeyDown}
          >
            {VARIABLES[key].label}
          </button>
        ))}
      </div>

      <div className="gq-chart-canvas" role="img" aria-label={chartLabel}>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: -8 }} accessibilityLayer>
            <CartesianGrid stroke="#e8eee5" strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis domain={config.domain} tick={{ fontSize: 11 }} tickLine={false} width={48} />
            <Tooltip
              labelFormatter={(label) => `Año ${label}`}
              formatter={(value) => (typeof value === "number" ? config.format(value) : NOT_AVAILABLE)}
              contentStyle={{ borderRadius: 8, border: "1px solid #dce7db", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="primary"
              name={primary.name}
              stroke="#287654"
              strokeWidth={2.4}
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
              unit={variable === "lst" ? " °C" : ""}
            />
            {secondary ? (
              <Line
                type="monotone"
                dataKey="secondary"
                name={secondary.name}
                stroke="#ed8951"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 2.5 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
                unit={variable === "lst" ? " °C" : ""}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="gq-chart-unit">Unidad: {config.unit}. Los huecos indican años sin dato.</p>
      {missingYears.length > 0 ? (
        <p className="gq-caveat" role="status">
          Sin dato de {config.label} en: {missingYears.join(", ")}. Se muestran como «No disponible», no como cero.
        </p>
      ) : null}
      <p className="gq-caveat">{config.caveat}</p>

      <details className="gq-data-table">
        <summary>Ver tabla de datos accesible</summary>
        <div className="gq-table-scroll">
          <table className="gq-table">
            <caption>{chartLabel}</caption>
            <thead>
              <tr>
                <th scope="col">Año</th>
                <th scope="col">{primary.name}</th>
                {secondary ? <th scope="col">{secondary.name}</th> : null}
                <th scope="col">Calidad</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year}>
                  <th scope="row">{row.year}</th>
                  <td>{config.format(row.primary)}</td>
                  {secondary ? <td>{config.format(row.secondary)}</td> : null}
                  <td>
                    {qualityLabel(row.quality)}
                    {secondary && row.secondaryQuality && row.secondaryQuality !== row.quality
                      ? ` / ${qualityLabel(row.secondaryQuality)}`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
