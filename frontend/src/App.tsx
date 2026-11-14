import { useEffect, useMemo, useState } from "react";
import type { DistrictData, Variable } from "../../shared/types/geoqocha";
import { loadDistricts } from "./lib/data-source";
import { districtColor, formatValue, getValue } from "./components/map/color-scales";
import { MapControls } from "./components/map/MapControls";
import { MapLegend } from "./components/map/MapLegend";
import { MapShell } from "./components/map/MapShell";
import type { IndexView } from "./components/map/map.types";

function App() {
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [year, setYear] = useState(2025);
  const [variable, setVariable] = useState<Variable>("icvsa");
  const [indexView, setIndexView] = useState<IndexView>("numeric");
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [showLstHeatmap, setShowLstHeatmap] = useState(true);
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
      </header>

      <main className="dashboard-main">
        {districts.length > 0 && (
          <MapShell
            districts={districts}
            year={year}
            variable={variable}
            indexView={indexView}
            selectedDistrictId={selectedDistrictId}
            showLstHeatmap={showLstHeatmap}
            onDistrictSelect={setSelectedDistrictId}
          />
        )}
        <MapLegend
          variable={variable}
          indexView={indexView}
          activeValue={selectedValue}
          showLstHeatmap={showLstHeatmap}
        />
        <div className="dashboard-map-status">
          <span className="dashboard-status">15 distritos · {year}</span>
          {selectedDistrict && (
            <span className="dashboard-selection">
              {selectedDistrict.name}: {formatValue(selectedValue, variable)}
            </span>
          )}
        </div>
      </main>
    </div>
  );
}

export { App };
