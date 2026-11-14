import type { DistrictData } from "../../../../shared/types/geoqocha";
import {
  formatArea,
  formatIndex,
  formatLst,
  formatNdvi,
  formatPerCapita,
  formatPopulation,
  formatRate,
  formatSigned,
  formatSignedPercent,
  qualityLabel,
  trendDirectionLabel,
} from "./format";
import {
  deficitLabel,
  equipmentGap,
  municipalGapRows,
  seriesPointForYear,
  type EquipmentMetricKey,
} from "./stats";
import "./analytics.css";

const GAP_FORMATTERS: Record<string, (value: number | null | undefined) => string> = {
  socioenvironmental_index: formatIndex,
  environmental_index: formatIndex,
  ndvi_mean: formatNdvi,
  lst_mean_celsius: formatLst,
  equipment_access_index: formatIndex,
  mobility_access_index: formatIndex,
  green_area_m2_per_capita: formatPerCapita,
  schools_per_1000: formatRate,
  health_centers_per_1000: formatRate,
};

const EQUIPMENT_LABELS: Array<{ key: EquipmentMetricKey; label: string; format: (value: number | null | undefined) => string }> = [
  { key: "schools_per_1000", label: "Escuelas", format: formatRate },
  { key: "health_centers_per_1000", label: "Centros de salud", format: formatRate },
  { key: "green_area_m2_per_capita", label: "Área verde", format: formatPerCapita },
  { key: "transport_coverage_fraction", label: "Cobertura de transporte", format: (value) => (value == null ? "No disponible" : `${(value * 100).toFixed(0)} %`) },
];

export interface DistrictProfileProps {
  district: DistrictData;
  districts: DistrictData[];
  year: number | null;
}

export function DistrictProfile({ district, districts, year }: DistrictProfileProps) {
  const point = seriesPointForYear(district, year);
  const effectiveYear = point?.year ?? district.latest_year;
  const rows = municipalGapRows(district, districts, effectiveYear);
  const topEquipment = EQUIPMENT_LABELS.slice(0, 3).map((entry) => ({
    ...entry,
    ...equipmentGap(district, districts, entry.key),
  }));

  return (
    <div className="gq-district-profile">
      <section className="gq-profile-section" aria-labelledby="gq-territory-title">
        <div className="gq-section-heading">
          <h4 id="gq-territory-title">Población y territorio</h4>
          <p>Datos demográficos y año de referencia de equipamiento y movilidad.</p>
        </div>
        <dl className="gq-summary-grid">
          <div>
            <dt>Población</dt>
            <dd>{formatPopulation(district.population)}</dd>
          </div>
          <div>
            <dt>Año de población</dt>
            <dd>{district.population_year ?? "No disponible"}</dd>
          </div>
          <div>
            <dt>Superficie</dt>
            <dd>{formatArea(district.area_km2)}</dd>
          </div>
          <div>
            <dt>Año de referencia territorial</dt>
            <dd>
              {district.territorial_reference_year ?? "No disponible"}
              <span className="gq-row-unit">Equipamiento y movilidad no se interpolan.</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="gq-profile-section" aria-labelledby="gq-gaps-title">
        <div className="gq-section-heading">
          <h4 id="gq-gaps-title">Brechas frente al promedio municipal</h4>
          <p>
            Diferencia entre el distrito y el promedio de los {rows[0]?.n ?? 0} distritos con dato en{" "}
            {effectiveYear ?? "el año consultado"}. Una brecha negativa indica desventaja relativa, no una causa.
          </p>
        </div>
        <div className="gq-table-scroll">
          <table className="gq-table">
            <caption>Brechas de {district.name} frente al promedio municipal.</caption>
            <thead>
              <tr>
                <th scope="col">Indicador</th>
                <th scope="col">Distrito</th>
                <th scope="col">Promedio</th>
                <th scope="col">Brecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const format = GAP_FORMATTERS[row.key] ?? formatIndex;
                return (
                  <tr key={row.key}>
                    <th scope="row">{row.label}</th>
                    <td>{format(row.value)}</td>
                    <td>
                      {format(row.average)}
                      <span className="gq-row-unit">n = {row.n}</span>
                    </td>
                    <td>
                      {row.gap == null ? (
                        <span className="gq-muted">No disponible</span>
                      ) : (
                        <>
                          {formatSigned(row.gap.absolute, format)}
                          {row.gap.relativePercent != null ? (
                            <span className="gq-row-unit">{formatSignedPercent(row.gap.relativePercent)}</span>
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
        <p className="gq-caveat">
          En LST, una brecha positiva indica mayor temperatura superficial que el promedio; no implica causalidad.
        </p>
      </section>

      <section className="gq-profile-section" aria-labelledby="gq-equipment-title">
        <div className="gq-section-heading">
          <h4 id="gq-equipment-title">Salud, educación y áreas verdes</h4>
          <p>Indicadores territoriales del año de referencia declarado.</p>
        </div>
        <div className="gq-metric-cards">
          {topEquipment.map((item) => (
            <article className="gq-metric-card" key={item.key}>
              <p className="gq-metric-label">{item.label}</p>
              <p className="gq-metric-value">{item.format(item.value)}</p>
              <p className="gq-metric-detail">
                Promedio municipal: {item.format(item.average.average)} (n = {item.average.n})
              </p>
              <p className={`gq-metric-gap ${item.gap && item.gap.absolute < 0 ? "is-negative" : ""}`}>
                {item.gap == null
                  ? "No disponible"
                  : `${formatSigned(item.gap.absolute, item.format)}${
                      item.gap.relativePercent != null ? ` · ${formatSignedPercent(item.gap.relativePercent)}` : ""
                    }`}
              </p>
            </article>
          ))}
        </div>
        {district.equipment.deficit_flags.length > 0 ? (
          <ul className="gq-flag-list" aria-label="Señales de déficit de equipamiento">
            {district.equipment.deficit_flags.map((flag) => (
              <li key={flag}>
                <span aria-hidden="true">!</span> {deficitLabel(flag)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="gq-caveat">No se declararon señales de déficit de equipamiento para este distrito.</p>
        )}
      </section>

      <section className="gq-profile-section" aria-labelledby="gq-trends-title">
        <div className="gq-section-heading">
          <h4 id="gq-trends-title">Tendencias históricas</h4>
          <p>Pendientes calculadas por el pipeline; se muestran sin reinterpretar las cifras.</p>
        </div>
        {district.trends.length === 0 ? (
          <p className="gq-caveat">No hay tendencias disponibles para este distrito.</p>
        ) : (
          <ul className="gq-trend-list">
            {district.trends.map((trend) => (
              <li key={trend.variable}>
                <div>
                  <strong>{trend.variable.replaceAll("_", " ")}</strong>
                  <span className="gq-badge gq-tone--neutral">{trendDirectionLabel(trend.direction)}</span>
                </div>
                <p>
                  {trend.slope_per_year == null
                    ? "Pendiente no disponible"
                    : `${trend.slope_per_year > 0 ? "+" : ""}${trend.slope_per_year} ${trend.unit}`}
                  {trend.years_used.length > 0 ? ` · ${trend.years_used[0]}–${trend.years_used[trend.years_used.length - 1]}` : ""}
                </p>
                <p className="gq-caveat">
                  {trend.method}
                  {trend.is_significant === false ? " · Sin significancia estadística declarada." : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="gq-profile-section" aria-labelledby="gq-quality-title">
        <div className="gq-section-heading">
          <h4 id="gq-quality-title">Calidad del dato</h4>
        </div>
        <p className="gq-quality-line">
          {effectiveYear ?? "Año no disponible"}: <strong>{qualityLabel(point?.data_quality_flag)}</strong>
        </p>
        <p className="gq-caveat">
          Fuentes: {district.source_refs.length > 0 ? district.source_refs.join(", ") : "sin fuente declarada"}.
          {district.data_status === "illustrative"
            ? " Los valores son ilustrativos y no representan mediciones oficiales."
            : district.data_status === "insufficient"
              ? " El distrito no cuenta con datos suficientes para todas las dimensiones."
              : ""}
        </p>
        <p className="gq-caveat">
          NDVI: vigor vegetal; LST: temperatura superficial (no del aire). Un dato ausente se muestra como
          «No disponible» y nunca como cero.
        </p>
      </section>
    </div>
  );
}
