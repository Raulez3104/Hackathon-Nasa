interface TransportControlProps {
  enabled: boolean;
  showStops: boolean;
  status: "idle" | "loading" | "ready" | "error";
  routeId: string;
  routes: readonly string[];
  onEnabledChange: (enabled: boolean) => void;
  onStopsChange: (visible: boolean) => void;
  onRouteChange: (routeId: string) => void;
}

export function TransportControl({
  enabled,
  showStops,
  status,
  routeId,
  routes,
  onEnabledChange,
  onStopsChange,
  onRouteChange,
}: TransportControlProps) {
  return (
    <section className="dashboard-transport-control" aria-label="Rutas de transporte">
      <label className="dashboard-check">
        <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
        <span>Rutas de transporte</span>
      </label>
      {enabled && (
        <>
          <label className="dashboard-check">
            <input type="checkbox" checked={showStops} onChange={(event) => onStopsChange(event.target.checked)} />
            <span>Mostrar paradas propuestas</span>
          </label>
          <label className="dashboard-control-label dashboard-transport-route">
            <span>Filtrar ruta</span>
            <select
              className="dashboard-control"
              value={routeId}
              onChange={(event) => onRouteChange(event.target.value)}
              disabled={status === "loading" || routes.length === 0}
            >
              <option value="">Todas las rutas</option>
              {routes.map((route) => <option key={route} value={route}>{route}</option>)}
            </select>
          </label>
          <span className={`dashboard-transport-status dashboard-transport-status-${status}`} role="status">
            {status === "loading" && "Cargando rutas…"}
            {status === "ready" && `${routes.length} rutas disponibles`}
            {status === "error" && "No se pudieron cargar las rutas"}
            {status === "idle" && "Lista para cargar"}
          </span>
          <p className="dashboard-layer-help">
            Las rutas provienen del GeoJSON incorporado. Las paradas se muestran como propuestas ilustrativas,
            no oficiales ni calificadas como seguras.
          </p>
        </>
      )}
    </section>
  );
}
