import type { DistrictData } from "../../../../shared/types/geoqocha";
import { DistrictPanel } from "./DistrictPanel";
import { formatDate } from "./format";
import { useDistrictDataset } from "./load-dataset";
import { latestYear } from "./stats";
import type { DatasetStatus } from "./types";
import "./analytics.css";

type WorkspaceView = "district" | "hotspots" | "methodology" | "sources" | "awareness";

export interface AnalyticsWorkspaceProps {
  /** Permite inyectar datos en pruebas y en la composición final. */
  districts?: DistrictData[];
  status?: DatasetStatus;
  error?: string | null;
  year?: number | null;
  view?: WorkspaceView;
}

/**
 * Vista de desarrollo e integración del frente DEV3.
 * No forma parte del shell de DEV1: consume las mismas props y la URL.
 */
export function AnalyticsWorkspace({
  districts: providedDistricts,
  status: providedStatus,
  error: providedError,
  year: providedYear,
  view = "district",
}: AnalyticsWorkspaceProps) {
  const loaded = useDistrictDataset();
  const districts = providedDistricts ?? loaded.dataset?.districts ?? [];
  const status = providedStatus ?? (loaded.status === "idle" ? "loading" : loaded.status);
  const error = providedError ?? loaded.error;
  const year = providedYear ?? latestYear(districts);
  const dataStatus = loaded.dataset?.data_status ?? (districts[0]?.data_status ?? "illustrative");

  return (
    <div className="gq-workspace">
      <header className="gq-workspace-header">
        <div>
          <p className="gq-eyebrow">GeoQocha · DEV3</p>
          <h1>Analítica y concientización</h1>
          <p>
            Panel distrital, comparación, series históricas y copiloto IA. La URL conserva el distrito, el año y la
            vista activa.
          </p>
        </div>
        <div className="gq-workspace-meta">
          <span className={`gq-data-badge gq-data-badge--${dataStatus}`}>
            {dataStatus === "illustrative"
              ? "Datos ilustrativos"
              : dataStatus === "real"
                ? "Datos reales"
                : "Datos insuficientes"}
          </span>
          {loaded.dataset ? <span>Actualizado: {formatDate(loaded.dataset.generated_at)}</span> : null}
          {loaded.usingFallback ? <span className="gq-warning-text">Se usó el mock por fallo del dataset real.</span> : null}
        </div>
      </header>

      <main className="gq-workspace-main">
        {view === "district" ? (
          <DistrictPanel
            districts={districts}
            status={status}
            error={error}
            year={year}
            variant="inline"
            onRetry={loaded.reload}
          />
        ) : null}
      </main>
    </div>
  );
}
