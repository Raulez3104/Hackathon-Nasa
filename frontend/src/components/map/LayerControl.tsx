import type { WmsLayerStatus } from "./map.types";

interface LayerControlProps {
  enabled: boolean;
  configured: boolean;
  opacity: number;
  status: WmsLayerStatus;
  onEnabledChange: (enabled: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  onRetry: () => void;
}

const STATUS_LABELS: Record<WmsLayerStatus, string> = {
  idle: "Lista para cargar",
  loading: "Cargando capa municipal…",
  ready: "Capa municipal disponible",
  error: "Capa degradada; mapa base disponible",
  unavailable: "Capa no configurada",
};

export function LayerControl({
  enabled,
  configured,
  opacity,
  status,
  onEnabledChange,
  onOpacityChange,
  onRetry,
}: LayerControlProps) {
  return (
    <section className="dashboard-layer-control" aria-label="Control de capas municipales">
      <div className="dashboard-layer-heading">
        <strong>Capas municipales</strong>
        <span className={`dashboard-layer-status dashboard-layer-status-${status}`} role="status">
          <span aria-hidden="true" />
          {STATUS_LABELS[status]}
        </span>
      </div>
      <label className="dashboard-check dashboard-layer-toggle">
        <input
          type="checkbox"
          checked={enabled}
          disabled={!configured}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        <span>Áreas de Equipamiento GAMC</span>
      </label>
      <label className="dashboard-layer-opacity">
        <span>Opacidad {Math.round(opacity * 100)}%</span>
        <input
          type="range"
          min="0.2"
          max="1"
          step="0.05"
          value={opacity}
          disabled={!configured || !enabled}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
        />
      </label>
      {status === "error" && (
        <div className="dashboard-layer-error" role="alert">
          <span>Los datos municipales no están disponibles temporalmente. El mock y el mapa base siguen activos.</span>
          <button type="button" onClick={onRetry}>Reintentar</button>
        </div>
      )}
      {!configured && (
        <p className="dashboard-layer-help">
          Configura <code>VITE_GAMC_EQUIPMENT_SERVICE_ID</code> para activar esta capa.
        </p>
      )}
    </section>
  );
}
