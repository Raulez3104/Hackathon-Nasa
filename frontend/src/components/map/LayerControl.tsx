import type { WmsLayerStatus } from "./map.types";
import { GAMC_LAYER_GROUPS, type GamcLayerDefinition, type GamcLayerGroup } from "../../services/wms/catalog";

interface LayerControlProps {
  layers: readonly GamcLayerDefinition[];
  visibility: Record<string, boolean>;
  statuses: Record<string, WmsLayerStatus>;
  opacity: number;
  onToggle: (layerId: string, enabled: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  onRetry: () => void;
}

const STATUS_LABELS: Record<WmsLayerStatus, string> = {
  idle: "Lista para cargar",
  loading: "Cargando capa municipal…",
  ready: "Capa municipal disponible",
  error: "Capa degradada; mapa base disponible",
  unavailable: "Capa no disponible",
};

const GROUP_ORDER: GamcLayerGroup[] = ["limites", "equipamiento", "poblacion"];

export function LayerControl({
  layers,
  visibility,
  statuses,
  opacity,
  onToggle,
  onOpacityChange,
  onRetry,
}: LayerControlProps) {
  const activeLayers = layers.filter((layer) => visibility[layer.id]);
  const hasError = activeLayers.some((layer) => statuses[layer.id] === "error");
  const isLoading = activeLayers.some((layer) => statuses[layer.id] === "loading");
  const summary = activeLayers.length === 0
    ? "Sin capas activas"
    : hasError
      ? "Capa degradada; mapa base disponible"
      : isLoading
        ? "Cargando capas municipales…"
        : `${activeLayers.length} ${activeLayers.length === 1 ? "capa activa" : "capas activas"}`;

  return (
    <section className="dashboard-layer-control" aria-label="Catálogo de capas municipales WMS">
      <div className="dashboard-layer-heading">
        <strong>Capas municipales GAMC</strong>
        <span className={`dashboard-layer-status ${hasError ? "dashboard-layer-status-error" : ""}`} role="status">
          <span aria-hidden="true" />
          {summary}
        </span>
      </div>

      {GROUP_ORDER.map((group) => {
        const groupLayers = layers.filter((layer) => layer.group === group);
        if (groupLayers.length === 0) return null;
        return (
          <fieldset className="dashboard-layer-group" key={group}>
            <legend>{GAMC_LAYER_GROUPS[group]}</legend>
            {groupLayers.map((layer) => {
              const status = statuses[layer.id] ?? "idle";
              const enabled = Boolean(visibility[layer.id]);
              return (
                <label className="dashboard-check dashboard-layer-toggle" key={layer.id}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => onToggle(layer.id, event.target.checked)}
                  />
                  <span className="dashboard-layer-name" title={layer.description}>{layer.name}</span>
                  <span
                    className={`dashboard-layer-dot dashboard-layer-dot-${status}`}
                    title={STATUS_LABELS[status]}
                    aria-label={STATUS_LABELS[status]}
                    role="img"
                  />
                </label>
              );
            })}
          </fieldset>
        );
      })}

      <label className="dashboard-layer-opacity">
        <span>Opacidad general {Math.round(opacity * 100)}%</span>
        <input
          type="range"
          min="0.2"
          max="1"
          step="0.05"
          value={opacity}
          disabled={activeLayers.length === 0}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
        />
      </label>

      <p className="dashboard-layer-help">
        Activa una o varias capas y haz clic en el mapa para consultar sus atributos. El WMS es solo visual:
        los cálculos usan vectores.
      </p>

      {hasError && (
        <div className="dashboard-layer-error" role="alert">
          <span>Algunas capas municipales no están disponibles temporalmente. El mapa base y los indicadores siguen activos.</span>
          <button type="button" onClick={onRetry}>Reintentar</button>
        </div>
      )}
    </section>
  );
}
