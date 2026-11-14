import { useState } from "react";
import type { DistrictData } from "../../../../shared/types/geoqocha";
import { ChatWidget } from "../ai/ChatWidget";
import { DiagnosisCards } from "../ai/DiagnosisCards";
import { AwarenessPanel } from "../awareness/AwarenessPanel";
import { DistrictPanel } from "./DistrictPanel";
import { HotspotsPanel } from "./HotspotsPanel";
import { MethodologyPanel } from "./MethodologyPanel";
import { SourcesPanel } from "./SourcesPanel";
import { formatDate } from "./format";
import { useDistrictDataset } from "./load-dataset";
import { latestYear } from "./stats";
import type { DatasetStatus } from "./types";
import "./analytics.css";

type WorkspaceView = "district" | "hotspots" | "methodology" | "sources" | "awareness" | "diagnosis";

const WORKSPACE_VIEWS: Array<{ id: WorkspaceView; label: string }> = [
  { id: "district", label: "Panel distrital" },
  { id: "hotspots", label: "Hotspots" },
  { id: "methodology", label: "Metodología" },
  { id: "sources", label: "Fuentes" },
  { id: "awareness", label: "Concientización" },
  { id: "diagnosis", label: "Diagnóstico" },
];

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
  const [activeView, setActiveView] = useState<WorkspaceView>(view);
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
            Panel distrital, comparación, series históricas, hotspots, metodología, fuentes y copiloto IA. La URL
            conserva el distrito, el año y la vista activa.
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

      <nav className="gq-workspace-nav" aria-label="Vistas de analítica">
        {WORKSPACE_VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="gq-chip"
            aria-pressed={activeView === item.id}
            onClick={() => setActiveView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="gq-workspace-main">
        {activeView === "district" ? (
          <>
            <DistrictPanel
              districts={districts}
              status={status}
              error={error}
              year={year}
              variant="inline"
              onRetry={loaded.reload}
            />
            <DiagnosisCards districts={districts} year={year} />
          </>
        ) : null}
        {activeView === "hotspots" ? (
          <HotspotsPanel districts={districts} status={status} error={error} year={year} onRetry={loaded.reload} />
        ) : null}
        {activeView === "methodology" ? (
          <MethodologyPanel districts={districts} status={status} error={error} year={year} onRetry={loaded.reload} />
        ) : null}
        {activeView === "sources" ? (
          <SourcesPanel status={status} error={error} onRetry={loaded.reload} />
        ) : null}
        {activeView === "awareness" ? (
          <AwarenessPanel districts={districts} status={status} error={error} year={year} onRetry={loaded.reload} />
        ) : null}
        {activeView === "diagnosis" ? <DiagnosisCards districts={districts} year={year} /> : null}
      </main>
      <ChatWidget districts={districts} year={year} />
    </div>
  );
}
