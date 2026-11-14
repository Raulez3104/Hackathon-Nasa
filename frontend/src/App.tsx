import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { DistrictData, Variable } from "../../shared/types/geoqocha";
import { loadDistricts } from "./lib/data-source";
import { formatValue, getValue } from "./components/map/color-scales";
import { MapControls } from "./components/map/MapControls";
import { MapLegend } from "./components/map/MapLegend";
import { MapShell } from "./components/map/MapShell";
import { LayerControl } from "./components/map/LayerControl";
import type { IndexView, WmsLayerStatus } from "./components/map/map.types";
import type { DatasetStatus } from "./components/analytics/types";
import { buildGamcVisibility, GAMC_LAYERS } from "./services/wms/catalog";

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
  const [gamcVisibility, setGamcVisibility] = useState<Record<string, boolean>>(() => buildGamcVisibility());
  const [gamcOpacity, setGamcOpacity] = useState(0.82);
  const [gamcReloadToken, setGamcReloadToken] = useState(0);
  const [gamcStatuses, setGamcStatuses] = useState<Record<string, WmsLayerStatus>>({});
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
  const activeGamcLayers = useMemo(
    () => GAMC_LAYERS.filter((layer) => gamcVisibility[layer.id]),
    [gamcVisibility],
  );
  const selectedValue = selectedDistrict ? getValue(selectedDistrict, year, variable) : null;
  const datasetStatus: DatasetStatus = error ? "error" : districts.length > 0 ? "ready" : "loading";

  const handleGamcToggle = useCallback((layerId: string, enabled: boolean) => {
    setGamcVisibility((current) => ({ ...current, [layerId]: enabled }));
  }, []);

  const handleGamcStatusChange = useCallback((layerId: string, status: WmsLayerStatus) => {
    setGamcStatuses((current) => (current[layerId] === status ? current : { ...current, [layerId]: status }));
  }, []);

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
              onYearChange={setYear}
              onVariableChange={setVariable}
              onIndexViewChange={setIndexView}
              onHeatmapChange={setShowLstHeatmap}
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
              gamcLayers={activeGamcLayers}
              gamcOpacity={gamcOpacity}
              gamcReloadToken={gamcReloadToken}
              onGamcStatusChange={handleGamcStatusChange}
              onDistrictSelect={setSelectedDistrictId}
            />
          )}
          <aside className="dashboard-side-panel">
            <LayerControl
              layers={GAMC_LAYERS}
              visibility={gamcVisibility}
              statuses={gamcStatuses}
              opacity={gamcOpacity}
              onToggle={handleGamcToggle}
              onOpacityChange={setGamcOpacity}
              onRetry={() => {
                setGamcStatuses({});
                setGamcReloadToken((token) => token + 1);
              }}
            />
            <MapLegend
              variable={variable}
              indexView={indexView}
              activeValue={selectedValue}
              showLstHeatmap={showLstHeatmap}
              gamcLayers={activeGamcLayers}
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
