import { useEffect, useMemo, useRef, useState } from "react";

const TRANSPORT_SOURCE_URL = "https://recursosgamc.cochabamba.bo/assets/geo/lineas_de_transporte.rar";

export interface TransportRouteInfo {
  id: string;
  label: string;
  category: string;
  routeType: string;
  routeTypes: string[];
  color: string;
  origin: string;
  destination: string;
  routeId: string;
  stops: number | null;
  source: string;
  sourceUrl: string;
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const trainAudioRef = useRef<HTMLAudioElement | null>(null);

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
            const rawTypes = properties.route_types ?? properties.route_type ?? properties.tipo ?? "Otro";
            const routeTypes = [...new Set(
              (Array.isArray(rawTypes) ? rawTypes : String(rawTypes).split(/[,+/|]/))
                .map((value) => categorizeTransportType(String(value)))
                .filter(Boolean),
            )];
            routes.set(id, {
              id,
              label: formatRouteLabel(id, properties.route_name),
              category: routeTypes[0] ?? "Otro",
              routeType: routeTypes[0] ?? "Transporte",
              routeTypes,
              color: typeof properties.color === "string" ? properties.color : "#7a4f2b",
              origin: String(properties.origin ?? "No disponible"),
              destination: String(properties.destination ?? "No disponible"),
              routeId: String(properties.route_id ?? id),
              stops: typeof properties.stop_count === "number" ? properties.stop_count : null,
              source: String(properties.data_status ?? "real"),
              sourceUrl: TRANSPORT_SOURCE_URL,
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
  const categories = useMemo(
    () => ["Todas", ...new Set(routeInfo.map((route) => route.category))],
    [routeInfo],
  );
  const filteredRoutes = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);
    return routeInfo.filter((route) => {
      const matchesCategory = category === "Todas" || route.category === category;
      const matchesSearch = !normalizedSearch
        || normalizeSearch(`${route.label} ${route.id} ${route.routeId}`).includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [category, routeInfo, search]);

  useEffect(() => {
    onRouteInfoChange?.(selectedRoute);
  }, [onRouteInfoChange, selectedRoute]);

  const selectRoute = (nextRoute: string) => {
    setAnimationKey((key) => key + 1);
    const nextRouteInfo = routeInfo.find((route) => route.id === nextRoute);
    // Se dispara dentro del clic del usuario para que el navegador no bloquee el audio.
    if (nextRouteInfo?.routeTypes.includes("Tren")) playTrainSound(trainAudioRef.current);
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
          <audio ref={trainAudioRef} preload="auto" src="/media/eo.mp3" aria-label="Sonido del tren" />
          <label className="dashboard-check">
            <input type="checkbox" checked={showStops} onChange={(event) => onStopsChange(event.target.checked)} />
            <span>Mostrar paradas propuestas</span>
          </label>
          {selectedRoute && (
            <div className="transport-animation" aria-label={`Avance de ${selectedRoute.label}`}>
              {selectedRoute.routeTypes.map((type, index) => (
                <img
                  key={`${selectedRoute.id}-${type}-${animationKey}`}
                  className="transport-animation-image"
                  style={{ animationDelay: `${index * 420}ms` }}
                  src={assetPath(type)}
                  alt={type}
                  onAnimationStart={() => {
                    if (type !== "Tren") {
                      playTransportSound(type);
                    }
                  }}
                  onError={(event) => {
                    event.currentTarget.src = fallbackAsset(type);
                  }}
                />
              ))}
            </div>
          )}
          <div className="dashboard-transport-route">
            <span className="dashboard-control-label">Selecciona una línea</span>
            <div className="transport-route-search">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por línea o número"
                aria-label="Buscar línea de transporte"
              />
            </div>
            <label className="transport-category-filter">
              <span>Categoría</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por tipo de transporte">
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <div className="transport-route-list" role="listbox" aria-label="Líneas de transporte">
              <p className="transport-route-help">Selecciona una línea o elige todas las rutas.</p>
              <button
                type="button"
                className={routeId === "" ? "transport-route-option is-selected" : "transport-route-option"}
                aria-selected={routeId === ""}
                onClick={() => selectRoute("")}
              >
                Todas las rutas
              </button>
              {filteredRoutes.map((routeInfoItem) => {
                const route = routeInfoItem.id;
                return (
                  <button
                    type="button"
                    key={route}
                    className={routeId === route ? "transport-route-option is-selected" : "transport-route-option"}
                    aria-selected={routeId === route}
                    onClick={() => selectRoute(route)}
                  >
                    {routeInfoItem.label}
                  </button>
                );
              })}
              {filteredRoutes.length === 0 && <p className="transport-route-empty">No hay líneas para esa búsqueda.</p>}
            </div>
          </div>
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
  const rawLabel = typeof routeName === "string" && routeName.trim() ? routeName : id;
  return titleCaseRoute(rawLabel
    .replace(/^linea_/, "Línea ")
    .replace(/_/g, " ")
    .trim());
}

function titleCaseRoute(value: string): string {
  return value.toLocaleLowerCase("es").replace(/(^|[\s-])([a-záéíóúñ])/g, (_, prefix: string, letter: string) =>
    `${prefix}${letter.toLocaleUpperCase("es")}`);
}

function categorizeTransportType(type: string): string {
  const normalized = type.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("micro")) return "Microbús";
  if (normalized.includes("mini") || normalized.includes("coaster") || normalized.includes("quaster")) return "Minibús";
  if (normalized.includes("trufi") || normalized.includes("taxi")) return "Trufi";
  if (normalized.includes("tren")) return "Tren";
  if (normalized.includes("telefer")) return "Teleférico";
  return "Otro";
}

function assetPath(type: string): string {
  const normalized = type.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("micro")) return "/resources/Transporte/Micro.png";
  if (normalized.includes("mini") || normalized.includes("quaster")) return "/resources/Transporte/Quaster.png";
  if (normalized.includes("trufi")) return "/resources/Transporte/Trufi.png";
  if (normalized.includes("tren")) return "/resources/Transporte/tren.png";
  if (normalized.includes("telefer")) return "/resources/Transporte/teleferico_subiendo_web.gif";
  return "/resources/Transporte/Trufi.png";
}

function fallbackAsset(type: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="42" viewBox="0 0 72 42"><rect width="72" height="42" rx="10" fill="#075985"/><text x="36" y="27" fill="white" font-size="16" font-family="Arial" text-anchor="middle">${type.slice(0, 1).toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function playTrainSound(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 1;
  audio.muted = false;
  void audio.play().catch(() => {
    // El navegador puede bloquear audio si la interacción no tiene permiso.
  });
}

function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

function playTransportSound(category: string | undefined): void {
  if (!category || typeof window === "undefined") return;
  const AudioContextConstructor = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;
  try {
    const context = new AudioContextConstructor();
    const frequencies: Record<string, number> = {
      Microbús: 220,
      Minibús: 280,
      Trufi: 340,
      Tren: 150,
      Teleférico: 440,
    };
    const play = () => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime;
      oscillator.frequency.value = frequencies[category] ?? 300;
      oscillator.type = category === "Tren" ? "square" : "sine";
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.26);
      oscillator.addEventListener("ended", () => void context.close());
    };
    if (context.state === "suspended") {
      void context.resume().then(play, () => void context.close());
    } else {
      play();
    }
  } catch {
    // El sonido es opcional y no debe impedir seleccionar una ruta.
  }
}
