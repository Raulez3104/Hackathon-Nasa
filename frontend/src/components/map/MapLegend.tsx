import type { Variable } from "../../../../shared/types/geoqocha";
import { getValue, semaphoreFor } from "./color-scales";
import type { IndexView } from "./map.types";
import { buildWmsUrl } from "../../services/wms/client";
import type { GamcLayerDefinition } from "../../services/wms/catalog";

interface MapLegendProps {
  variable: Variable;
  indexView: IndexView;
  activeValue: number | null;
  showLstHeatmap: boolean;
  gamcLayers?: readonly GamcLayerDefinition[];
}

export function MapLegend({ variable, indexView, activeValue, showLstHeatmap, gamcLayers = [] }: MapLegendProps) {
  const semaphore = semaphoreFor(activeValue);
  const title = variable === "lst" ? "Temperatura superficial" : variable === "ndvi" ? "Vegetación NDVI" : "Índice visible";

  return (
    <aside className="dashboard-panel dashboard-legend-panel" aria-label="Leyenda del mapa">
      <span className="dashboard-panel-label">Lectura del mapa</span>
      <h2>{title}</h2>
      <p className="dashboard-panel-copy">
        {variable === "lst" ? "Intensidad térmica por distrito." : "Selecciona un distrito para consultar su valor."}
      </p>

      {variable === "icvsa" && indexView === "semaphore" ? (
        <div className="dashboard-legend">
          <LegendRow color="#2f855a" label="70–100 · Favorable" icon="✓" />
          <LegendRow color="#c8872d" label="40–69 · Intermedia" icon="!" />
          <LegendRow color="#c4514d" label="1–39 · Atención" icon="!" />
        </div>
      ) : (
        <div className={`dashboard-gradient dashboard-gradient-${variable}`} aria-label={`Escala de ${variable}`} />
      )}

      <div className="dashboard-legend-scale">
        <span>{variable === "lst" ? "24 °C" : variable === "ndvi" ? "0.15" : "1"}</span>
        <span>{variable === "lst" ? "36 °C" : variable === "ndvi" ? "0.65" : "100"}</span>
      </div>

      {showLstHeatmap && (
        <div className="dashboard-heatmap-note">
          <span className="dashboard-swatch" style={{ background: "var(--color-heat-4)" }} />
          <span>Mapa de calor LST activo · resolución distrital</span>
        </div>
      )}

      {gamcLayers.length > 0 && (
        <div className="dashboard-gamc-legends">
          <span className="dashboard-panel-label">Leyendas municipales</span>
          {gamcLayers.map((layer) => (
            <div className="dashboard-heatmap-note" key={layer.id}>
              <img
                src={buildWmsUrl({
                  serviceId: layer.id,
                  operation: "GetLegendGraphic",
                  version: "1.0.0",
                  format: "image/png",
                })}
                alt={`Leyenda de ${layer.name} del GAMC`}
                loading="lazy"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              <span>{layer.name} · fuente municipal real</span>
            </div>
          ))}
        </div>
      )}

      {variable === "icvsa" && indexView === "semaphore" && (
        <div className="dashboard-status" style={{ color: semaphore.color }}>
          {semaphore.icon} {semaphore.label}
        </div>
      )}

      <p className="dashboard-disclaimer">
        Datos ilustrativos para desarrollo. El semáforo incluye texto e ícono; el color no es la única señal.
      </p>
    </aside>
  );
}

function LegendRow({ color, label, icon }: { color: string; label: string; icon: string }) {
  return (
    <div className="dashboard-legend-row">
      <span className="dashboard-swatch" style={{ background: color }} aria-hidden="true" />
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export { getValue };
