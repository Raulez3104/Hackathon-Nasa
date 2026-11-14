import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { DistrictData, Variable } from "../../shared/types/geoqocha";
import { loadDistricts } from "./lib/data-source";
import { formatValue, getValue } from "./components/map/color-scales";
import { MapControls } from "./components/map/MapControls";
import { MapLegend } from "./components/map/MapLegend";
import { MapShell } from "./components/map/MapShell";
import { LayerControl } from "./components/map/LayerControl";
import type { IndexView, WmsLayerStatus } from "./components/map/map.types";
import type { DatasetStatus } from "./components/analytics/types";

// La analítica se carga aparte para que el mapa siga siendo ligero.
const AnalyticsWorkspace = lazy(() =>
  import("./components/analytics/AnalyticsWorkspace").then((module) => ({ default: module.AnalyticsWorkspace })),
);

type AppView = "map" | "analytics";

function App() {
  const [activeView, setActiveView] = useState<AppView>("map");
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [year, setYear] = useState(2025);
  const [variable, setVariable] = useState<Variable>("icvsa");
  const [indexView, setIndexView] = useState<IndexView>("numeric");
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [showLstHeatmap, setShowLstHeatmap] = useState(true);
  const [showGamcEquipment, setShowGamcEquipment] = useState(false);
  const [gamcEquipmentOpacity, setGamcEquipmentOpacity] = useState(0.82);
  const [gamcReloadToken, setGamcReloadToken] = useState(0);
  const [gamcStatus, setGamcStatus] = useState<WmsLayerStatus>(
    import.meta.env.VITE_GAMC_EQUIPMENT_SERVICE_ID ? "idle" : "unavailable",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDistricts()
      .then((dataset) => setDistricts(dataset.districts))
      .catch(() => setError("No se pudieron cargar los datos del mapa."));
  }, []);

  const selectedDistrict = useMemo(
    () => districts.find((district) => district.district_id === selectedDistrictId) ?? null,
    [districts, selectedDistrictId],
  );
  const selectedValue = selectedDistrict ? getValue(selectedDistrict, year, variable) : null;
  const datasetStatus: DatasetStatus = error ? "error" : districts.length > 0 ? "ready" : "loading";

  if (error) {
    return (
      <main className="dashboard-state">
        <h1>No se pudo cargar GeoQocha</h1>
        <p>{error} Revisa el archivo de datos ilustrativos e inténtalo nuevamente.</p>
      </main>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="/" aria-label="GeoQocha, inicio">
          <span className="dashboard-brand-mark" aria-hidden="true">G</span>
          <span>GeoQocha</span>
        </a>
        <div className="dashboard-header-actions">
          <nav className="dashboard-view-switch" aria-label="Vistas principales">
            <button type="button" aria-pressed={activeView === "map"} onClick={() => setActiveView("map")}>
              Mapa
            </button>
            <button type="button" aria-pressed={activeView === "analytics"} onClick={() => setActiveView("analytics")}>
              Analítica
            </button>
          </nav>
          {activeView === "map" && (
            <MapControls
              year={year}
              variable={variable}
              indexView={indexView}
              showLstHeatmap={showLstHeatmap}
              showGamcEquipment={showGamcEquipment}
              onYearChange={setYear}
              onVariableChange={setVariable}
              onIndexViewChange={setIndexView}
              onHeatmapChange={setShowLstHeatmap}
              onGamcEquipmentChange={setShowGamcEquipment}
            />
          )}
        </div>
      </header>

      {activeView === "analytics" ? (
        <Suspense
          fallback={
            <main className="dashboard-state" aria-busy="true">
              <p>Cargando analítica y concientización…</p>
            </main>
          }
        >
          <AnalyticsWorkspace districts={districts} status={datasetStatus} year={year} error={error} />
        </Suspense>
      ) : (
        <main className="dashboard-main">
          {districts.length > 0 && (
            <MapShell
              districts={districts}
              year={year}
              variable={variable}
              indexView={indexView}
              selectedDistrictId={selectedDistrictId}
              showLstHeatmap={showLstHeatmap}
              showGamcEquipment={showGamcEquipment}
              gamcEquipmentOpacity={gamcEquipmentOpacity}
              gamcReloadToken={gamcReloadToken}
              onGamcStatusChange={setGamcStatus}
              onDistrictSelect={setSelectedDistrictId}
            />
          )}
          <aside className="dashboard-side-panel">
            <LayerControl
              enabled={showGamcEquipment}
              configured={Boolean(import.meta.env.VITE_GAMC_EQUIPMENT_SERVICE_ID)}
              opacity={gamcEquipmentOpacity}
              status={gamcStatus}
              onEnabledChange={setShowGamcEquipment}
              onOpacityChange={setGamcEquipmentOpacity}
              onRetry={() => {
                setGamcStatus("idle");
                setGamcReloadToken((token) => token + 1);
              }}
            />
            <MapLegend
              variable={variable}
              indexView={indexView}
              activeValue={selectedValue}
              showLstHeatmap={showLstHeatmap}
              showGamcEquipment={showGamcEquipment}
            />
            <div className="dashboard-map-status">
              <span className="dashboard-status">15 distritos · {year}</span>
              {selectedDistrict && (
                <span className="dashboard-selection">
                  {selectedDistrict.name}: {formatValue(selectedValue, variable)}
                </span>
              )}
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}

export { App };
