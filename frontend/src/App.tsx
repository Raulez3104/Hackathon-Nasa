import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { DistrictData, Variable } from "../../shared/types/geoqocha";
import { loadDistricts } from "./lib/data-source";
import { formatValue, getValue } from "./components/map/color-scales";
import { MapControls } from "./components/map/MapControls";
import { MapLegend } from "./components/map/MapLegend";
import { LayerControl } from "./components/map/LayerControl";
import { TransportControl } from "./components/map/TransportControl";
import { MapComparisonControl } from "./components/map/MapComparisonControl";
import type { IndexView, WmsLayerStatus } from "./components/map/map.types";
import { useMapUrlState } from "./components/map/useMapUrlState";
import type { DatasetStatus } from "./components/analytics/types";
import { buildGamcVisibility, GAMC_LAYERS } from "./services/wms/catalog";

// La analítica se carga aparte para que el mapa siga siendo ligero.
const AnalyticsWorkspace = lazy(() =>
  import("./components/analytics/AnalyticsWorkspace").then((module) => ({ default: module.AnalyticsWorkspace })),
);
const MapShell = lazy(() =>
  import("./components/map/MapShell").then((module) => ({ default: module.MapShell })),
);

type AppView = "map" | "analytics";

function App() {
  const [activeView, setActiveView] = useState<AppView>("map");
  const mapUrl = useMapUrlState();
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const { state: mapState } = mapUrl;
  const year = mapState.year;
  const variable = mapState.variable;
  const indexView = mapState.view;
  const selectedDistrictId = mapState.districtId;
  const showLstHeatmap = mapState.layers.length === 0 || mapState.layers.includes("lst");
  const showTransport = mapState.layers.includes("transport");
  const showTransportStops = mapState.layers.includes("transport_stops");
  const [transportRoute, setTransportRoute] = useState("");
  const [transportRoutes, setTransportRoutes] = useState<string[]>([]);
  const [transportStatus, setTransportStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [gamcVisibility, setGamcVisibility] = useState<Record<string, boolean>>(
    () => buildGamcVisibility(mapState.layers.filter((layer) => GAMC_LAYERS.some((definition) => definition.id === layer))),
  );
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

  useEffect(() => {
    const layers = [
      ...GAMC_LAYERS.filter((layer) => gamcVisibility[layer.id]).map((layer) => layer.id),
      ...(showLstHeatmap ? ["lst"] : []),
      ...(showTransport ? ["transport"] : []),
      ...(showTransportStops ? ["transport_stops"] : []),
    ];
    if (layers.join(",") !== mapState.layers.join(",")) mapUrl.setLayers(layers);
  }, [gamcVisibility, mapState.layers, mapUrl.setLayers, showLstHeatmap, showTransport]);

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
              onYearChange={mapUrl.setYear}
              onVariableChange={mapUrl.setVariable}
              onIndexViewChange={mapUrl.setView}
              onHeatmapChange={(visible) => {
                const layers = mapState.layers.filter((layer) => layer !== "lst");
                mapUrl.setLayers(visible ? [...layers, "lst"] : layers);
              }}
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
            <Suspense fallback={<div className="dashboard-map-loading" role="status">Cargando mapa…</div>}>
              <MapShell
                districts={districts}
                year={year}
                variable={variable}
                indexView={indexView}
                selectedDistrictId={selectedDistrictId}
                showLstHeatmap={showLstHeatmap}
              showTransport={showTransport}
              showTransportStops={showTransportStops}
                transportRoute={transportRoute}
                selectedDistrictGeometry={selectedDistrict?.geometry ?? null}
                onTransportRoutesLoaded={setTransportRoutes}
                onTransportStatusChange={setTransportStatus}
                gamcLayers={activeGamcLayers}
                gamcOpacity={gamcOpacity}
                gamcReloadToken={gamcReloadToken}
                onGamcStatusChange={handleGamcStatusChange}
                onDistrictSelect={mapUrl.selectDistrict}
              />
            </Suspense>
          )}
          <aside className="dashboard-side-panel">
            <TransportControl
              enabled={showTransport}
              showStops={showTransportStops}
              status={transportStatus}
              routeId={transportRoute}
              routes={transportRoutes}
              onEnabledChange={(enabled) => {
                const layers = mapState.layers.filter((layer) => layer !== "transport");
                mapUrl.setLayers(enabled ? [...layers, "transport"] : layers);
              }}
              onStopsChange={(visible) => {
                const layers = mapState.layers.filter((layer) => layer !== "transport_stops");
                mapUrl.setLayers(visible ? [...layers, "transport_stops"] : layers);
              }}
              onRouteChange={setTransportRoute}
            />
            <MapComparisonControl
              districts={districts}
              ids={mapState.compareIds}
              year={year}
              variable={variable}
              onChange={mapUrl.setComparison}
            />
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
