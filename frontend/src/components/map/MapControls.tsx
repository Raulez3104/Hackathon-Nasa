import type { Variable } from "../../../../shared/types/geoqocha";
import { VARIABLE_OPTIONS, YEAR_OPTIONS } from "./color-scales";
import type { IndexView } from "./map.types";

interface MapControlsProps {
  year: number;
  variable: Variable;
  indexView: IndexView;
  showLstHeatmap: boolean;
  onYearChange: (year: number) => void;
  onVariableChange: (variable: Variable) => void;
  onIndexViewChange: (view: IndexView) => void;
  onHeatmapChange: (visible: boolean) => void;
}

export function MapControls({
  year,
  variable,
  indexView,
  showLstHeatmap,
  onYearChange,
  onVariableChange,
  onIndexViewChange,
  onHeatmapChange,
}: MapControlsProps) {
  return (
    <div className="dashboard-controls" aria-label="Controles del mapa">
      <label className="dashboard-control-label">
        <span>Año</span>
        <select className="dashboard-control" value={year} onChange={(event) => onYearChange(Number(event.target.value))}>
          {YEAR_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="dashboard-control-label">
        <span>Variable</span>
        <select
          className="dashboard-control"
          value={variable}
          onChange={(event) => onVariableChange(event.target.value as Variable)}
        >
          {VARIABLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <div className="dashboard-toggle" aria-label="Vista del ICVSA">
        <button type="button" aria-pressed={indexView === "numeric"} onClick={() => onIndexViewChange("numeric")}>
          1–100
        </button>
        <button type="button" aria-pressed={indexView === "semaphore"} onClick={() => onIndexViewChange("semaphore")}>
          Semáforo
        </button>
      </div>
      <label className="dashboard-check">
        <input type="checkbox" checked={showLstHeatmap} onChange={(event) => onHeatmapChange(event.target.checked)} />
        <span>Calor LST</span>
      </label>
    </div>
  );
}
