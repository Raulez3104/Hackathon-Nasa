import type { DistrictData } from "../../../../shared/types/geoqocha";
import {
  formatFractionPercent,
  formatIndex,
  formatLst,
  formatNdvi,
  formatPerCapita,
  formatRate,
  formatSigned,
  formatSignedPercent,
  qualityLabel,
} from "./format";
import { districtById, gapVsMunicipal, seriesPointForYear } from "./stats";
import type { MetricKey } from "./types";
import { SeriesChart } from "./SeriesChart";
import "./analytics.css";

interface ComparisonRow {
  label: string;
  unit: string;
  metric?: MetricKey;
  format: (value: number | null | undefined) => string;
  reference: "year" | "territorial";
}

const ROWS: ComparisonRow[] = [
  {
    label: "ICVSA",
    unit: "índice 1–100",
    metric: "socioenvironmental_index",
    format: formatIndex,
    reference: "year",
  },
  {
    label: "Índice ambiental",
    unit: "índice 1–100",
    metric: "environmental_index",
    format: formatIndex,
    reference: "year",
  },
  {
    label: "NDVI medio",
    unit: "índice −1 a 1",
    metric: "ndvi_mean",
    format: formatNdvi,
    reference: "year",
  },
  {
    label: "LST media",
    unit: "°C",
    metric: "lst_mean_celsius",
    format: formatLst,
    reference: "year",
  },
  {
    label: "Acceso a equipamiento",
    unit: "índice 0–100",
    format: formatIndex,
    reference: "territorial",
  },
  {
    label: "Acceso a movilidad",
    unit: "índice 0–100",
    format: formatIndex,
    reference: "territorial",
  },
  {
    label: "Área verde por habitante",
    unit: "m²/hab.",
    format: formatPerCapita,
    reference: "territorial",
  },
  {
    label: "Escuelas por 1.000 hab.",
    unit: "tasa",
    format: formatRate,
    reference: "territorial",
  },
  {
    label: "Centros de salud por 1.000 hab.",
    unit: "tasa",
    format: formatRate,
    reference: "territorial",
  },
  {
    label: "Cobertura de transporte",
    unit: "fracción 0–1",
    format: (value) => formatFractionPercent(value, 0),
    reference: "territorial",
  },
];

function pickRowValue(row: ComparisonRow, district: DistrictData, year: number | null): number | null {
  if (row.reference === "year" && row.metric) {
    const point = seriesPointForYear(district, year);
    if (!point) return null;
    const value = point[row.metric];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  switch (row.label) {
    case "Acceso a equipamiento":
      return district.equipment.equipment_access_index;
    case "Acceso a movilidad":
      return district.equipment.mobility_access_index;
    case "Área verde por habitante":
      return district.equipment.green_area_m2_per_capita;
    case "Escuelas por 1.000 hab.":
      return district.equipment.schools_per_1000;
    case "Centros de salud por 1.000 hab.":
      return district.equipment.health_centers_per_1000;
    case "Cobertura de transporte":
      return district.equipment.transport_coverage_fraction;
    default:
      return null;
  }
}

function difference(left: number | null, right: number | null): { absolute: number; relativePercent: number | null } | null {
  if (left == null || right == null) return null;
  const absolute = right - left;
  return {
    absolute,
    relativePercent: left === 0 ? null : (absolute / Math.abs(left)) * 100,
  };
}

export interface ComparisonPanelProps {
  districts: DistrictData[];
  leftId: number | null;
  rightId: number | null;
  year: number | null;
  onChange: (ids: number[]) => void;
  labels?: { left: string; right: string };
}

export function ComparisonPanel({
  districts,
  leftId,
  rightId,
  year,
  onChange,
  labels = { left: "Distrito A", right: "Distrito B" },
}: ComparisonPanelProps) {
  const left = districtById(districts, leftId);
  const right = districtById(districts, rightId);
  const effectiveYear = year ?? left?.latest_year ?? right?.latest_year ?? null;
  const leftPoint = left ? seriesPointForYear(left, effectiveYear) : null;
  const rightPoint = right ? seriesPointForYear(right, effectiveYear) : null;
  const leftGap = left ? gapVsMunicipal(left, districts, "socioenvironmental_index", effectiveYear) : null;
  const rightGap = right ? gapVsMunicipal(right, districts, "socioenvironmental_index", effectiveYear) : null;

  const update = (side: "left" | "right", value: string) => {
    const id = Number(value);
    const next = Number.isInteger(id) && id > 0 ? id : null;
    const current = side === "left" ? leftId : rightId;
    const other = side === "left" ? rightId : leftId;
    if (next == null) {
      onChange(other != null ? [other] : []);
      return;
    }
    if (next === other) {
      onChange([next]);
      return;
    }
    const pair = side === "left" ? [next, other] : [other, next];
    onChange(pair.filter((item): item is number => item != null));
  };

  const warnings: string[] = [];
  if (leftPoint && leftPoint.data_quality_flag !== "ok") {
    warnings.push(`${left?.name ?? "El distrito A"}: ${qualityLabel(leftPoint.data_quality_flag).toLowerCase()} en ${leftPoint.year}.`);
  }
  if (rightPoint && rightPoint.data_quality_flag !== "ok") {
    warnings.push(`${right?.name ?? "El distrito B"}: ${qualityLabel(rightPoint.data_quality_flag).toLowerCase()} en ${rightPoint.year}.`);
  }

  return (
    <section className="gq-comparison" aria-labelledby="gq-comparison-title">
      <div className="gq-section-heading">
        <p className="gq-eyebrow">Comparación</p>
        <h3 id="gq-comparison-title">Dos distritos lado a lado</h3>
        <p>
          {effectiveYear != null
            ? `Valores del año ${effectiveYear}.`
            : "Selecciona un año en el tablero para comparar la serie."}{" "}
          Equipamiento y movilidad usan el año de referencia territorial.
        </p>
      </div>

      <div className="gq-select-row">
        <label className="gq-field">
          <span>{labels.left}</span>
          <select value={leftId ?? ""} onChange={(event) => update("left", event.target.value)}>
            <option value="">Selecciona…</option>
            {districts.map((district) => (
              <option key={district.district_id} value={district.district_id}>
                {district.name}
              </option>
            ))}
          </select>
        </label>
        <label className="gq-field">
          <span>{labels.right}</span>
          <select value={rightId ?? ""} onChange={(event) => update("right", event.target.value)}>
            <option value="">Selecciona…</option>
            {districts.map((district) => (
              <option key={district.district_id} value={district.district_id}>
                {district.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!left || !right ? (
        <div className="gq-empty gq-empty--compact">
          <strong>Faltan distritos por elegir</strong>
          <p>Selecciona dos distritos distintos para ver sus valores y diferencias.</p>
        </div>
      ) : (
        <>
          <div className="gq-table-scroll">
            <table className="gq-table">
              <caption>
                Comparación de {left.name} y {right.name}
                {effectiveYear != null ? ` en ${effectiveYear}` : ""}.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Indicador</th>
                  <th scope="col">{left.name}</th>
                  <th scope="col">{right.name}</th>
                  <th scope="col">Diferencia (B − A)</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const leftValue = pickRowValue(row, left, effectiveYear);
                  const rightValue = pickRowValue(row, right, effectiveYear);
                  const diff = difference(leftValue, rightValue);
                  return (
                    <tr key={row.label}>
                      <th scope="row">
                        {row.label}
                        <span className="gq-row-unit">{row.unit}</span>
                      </th>
                      <td>{row.format(leftValue)}</td>
                      <td>{row.format(rightValue)}</td>
                      <td>
                        {diff == null ? (
                          <span className="gq-muted">No disponible</span>
                        ) : (
                          <>
                            {formatSigned(diff.absolute, row.format)}
                            {diff.relativePercent != null ? (
                              <span className="gq-row-unit">{formatSignedPercent(diff.relativePercent)}</span>
                            ) : null}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="gq-source-note">
            Año de referencia territorial: {left.territorial_reference_year ?? "no disponible"} /{" "}
            {right.territorial_reference_year ?? "no disponible"}. Los valores no disponibles se muestran como
            «No disponible» y nunca como cero.
          </p>

          <div className="gq-gap-callout" aria-label="Brecha de ICVSA frente al promedio municipal">
            <p>
              <strong>Brecha de ICVSA vs. promedio municipal:</strong>{" "}
              {left.name}{" "}
              {leftGap?.gap
                ? `${formatSigned(leftGap.gap.absolute, formatIndex)} (${formatSignedPercent(leftGap.gap.relativePercent)})`
                : "No disponible"}{" "}
              · {right.name}{" "}
              {rightGap?.gap
                ? `${formatSigned(rightGap.gap.absolute, formatIndex)} (${formatSignedPercent(rightGap.gap.relativePercent)})`
                : "No disponible"}
            </p>
            <p className="gq-caveat">
              Promedio calculado con n = {leftGap?.average.n ?? 0} distritos con dato. Una brecha negativa indica
              desventaja relativa; no implica causalidad.
            </p>
          </div>

          <SeriesChart primary={left} secondary={right} year={effectiveYear} />

          {warnings.length > 0 ? (
            <ul className="gq-warning-list" aria-label="Advertencias de calidad del dato">
              {warnings.map((warning) => (
                <li key={warning}>
                  <span aria-hidden="true">!</span> {warning}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}
