import { useEffect, useMemo, useState } from "react";

export interface TransportRouteInfo {
  id: string;
  label: string;
  routeType: string;
  routeTypes: string[];
  color: string;
  origin: string;
  destination: string;
  routeId: string;
  stops: number | null;
  source: string;
}

interface TransportControlProps {
  enabled: boolean;
  showStops: boolean;
  status: "idle" | "loading" | "ready" | "error";
  routeId: string;
  routes: readonly string[];
  onEnabledChange: (enabled: boolean) => void;
  onStopsChange: (visible: boolean) => void;
  onRouteChange: (routeId: string) => void;
  onRouteInfoChange?: (route: TransportRouteInfo | null) => void;
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
  onRouteInfoChange,
}: TransportControlProps) {
  const [routeInfo, setRouteInfo] = useState<TransportRouteInfo[]>([]);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/transport.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo cargar el catálogo de transporte");
        return response.json() as Promise<{
          features: Array<{ geometry?: { type?: string }; properties?: Record<string, unknown> }>;
        }>;
      })
      .then((collection) => {
        if (cancelled) return;
        const routes = new Map<string, TransportRouteInfo>();
        collection.features
          .filter((feature) => feature.geometry?.type === "LineString")
          .forEach((feature) => {
            const properties = feature.properties ?? {};
            const id = String(properties.route_group ?? properties.route_id ?? "");
            if (!id || routes.has(id)) return;
            const rawTypes = properties.route_types ?? properties.route_type ?? properties.tipo ?? "Transporte";
            const routeTypes = (Array.isArray(rawTypes) ? rawTypes : String(rawTypes).split(/[,+/|]/))
              .map((value) => String(value).trim())
              .filter(Boolean);
            routes.set(id, {
              id,
              label: formatRouteLabel(id, properties.route_name),
              routeType: routeTypes[0] ?? "Transporte",
              routeTypes,
              color: typeof properties.color === "string" ? properties.color : "#7a4f2b",
              origin: String(properties.origin ?? "No disponible"),
              destination: String(properties.destination ?? "No disponible"),
              routeId: String(properties.route_id ?? id),
              stops: typeof properties.stop_count === "number" ? properties.stop_count : null,
              source: String(properties.data_status ?? "real"),
            });
          });
        setRouteInfo([...routes.values()].sort((a, b) => a.label.localeCompare(b.label, "es", { numeric: true })));
      })
      .catch(() => {
        if (!cancelled) setRouteInfo([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRoute = useMemo(
    () => routeInfo.find((route) => route.id === routeId) ?? null,
    [routeId, routeInfo],
  );

  useEffect(() => {
    onRouteInfoChange?.(selectedRoute);
  }, [onRouteInfoChange, selectedRoute]);

  const selectRoute = (nextRoute: string) => {
    setAnimationKey((key) => key + 1);
    onRouteChange(nextRoute);
  };

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
          <div className="dashboard-transport-route">
            <span className="dashboard-control-label">Selecciona una línea</span>
            <div className="transport-route-list" role="listbox" aria-label="Líneas de transporte">
              <button
                type="button"
                className={routeId === "" ? "transport-route-option is-selected" : "transport-route-option"}
                aria-selected={routeId === ""}
                onClick={() => selectRoute("")}
              >
                Todas las rutas
              </button>
              {routes.map((route) => (
                <button
                  type="button"
                  key={route}
                  className={routeId === route ? "transport-route-option is-selected" : "transport-route-option"}
                  aria-selected={routeId === route}
                  onClick={() => selectRoute(route)}
                >
                  {routeInfo.find((info) => info.id === route)?.label ?? route}
                </button>
              ))}
            </div>
          </div>
          {selectedRoute && (
            <div className="transport-animation" aria-label={`Avance de ${selectedRoute.label}`}>
              {selectedRoute.routeTypes.map((type, index) => (
                <img
                  key={`${selectedRoute.id}-${type}-${animationKey}`}
                  className="transport-animation-image"
                  style={{ animationDelay: `${index * 360}ms` }}
                  src={`/resources/Transporte/${assetName(type)}.png`}
                  alt={type}
                  onError={(event) => {
                    event.currentTarget.src = fallbackAsset(type);
                  }}
                />
              ))}
            </div>
          )}
          <span className={`dashboard-transport-status dashboard-transport-status-${status}`} role="status">
            {status === "loading" && "Cargando rutas…"}
            {status === "ready" && `${routes.length} rutas disponibles`}
            {status === "error" && "No se pudieron cargar las rutas"}
            {status === "idle" && "Lista para cargar"}
          </span>
          <p className="dashboard-layer-help">
            Las rutas provienen del GeoJSON incorporado. Las paradas se muestran como propuestas,
            no oficiales ni calificadas como seguras.
          </p>
        </>
      )}
    </section>
  );
}

function formatRouteLabel(id: string, routeName: unknown): string {
  if (typeof routeName === "string" && routeName.trim()) return routeName;
  return id
    .replace(/^linea_/, "Línea ")
    .replace(/^(microbus|minibus|trufi)_?/i, (_, type: string) => `${type === "microbus" ? "Microbús" : type === "minibus" ? "Minibús" : "Trufi"} `)
    .replace(/_/g, " ")
    .trim();
}

function assetName(type: string): string {
  const normalized = type.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("micro")) return "Micro";
  if (normalized.includes("mini") || normalized.includes("coaster") || normalized.includes("quaster")) return "Quaster";
  if (normalized.includes("trufi")) return "Trufi";
  if (normalized.includes("taxi")) return "Taxi Trufi H";
  return type;
}

function fallbackAsset(type: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="42" viewBox="0 0 72 42"><rect width="72" height="42" rx="10" fill="#075985"/><text x="36" y="27" fill="white" font-size="16" font-family="Arial" text-anchor="middle">${type.slice(0, 1).toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
