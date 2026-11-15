import type { ReactNode } from "react";

export type GeoQochaView = "map" | "analytics";

interface GeoQochaNavbarProps {
  variant: "landing" | "dashboard";
  activeView?: GeoQochaView;
  onViewChange?: (view: GeoQochaView) => void;
  trailing?: ReactNode;
}

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;
}

function Brand() {
  return (
    <a className="geoq-navbar-brand" href="/" aria-label="GeoQocha, inicio">
      <span className="geoq-navbar-brand-icon"><Icon name="satellite_alt" /></span>
      <span>
        <strong>GeoQocha</strong>
        <small>VALLE CENTRAL DE COCHABAMBA</small>
      </span>
    </a>
  );
}

export function GeoQochaNavbar({
  variant,
  activeView = "map",
  onViewChange,
  trailing,
}: GeoQochaNavbarProps) {
  const isDashboard = variant === "dashboard";

  return (
    <>
      <aside className="geoq-navbar-notice" aria-label="Aviso de validación técnica">
        <span><Icon name="travel_explore" /> Demo con datos ilustrativos</span>
        <small>Los resultados deben validarse con fuentes oficiales NASA y GAMC.</small>
      </aside>
      <header className="geoq-navbar">
        <Brand />
        <nav className="geoq-navbar-links" aria-label="Navegación principal">
          <a href={isDashboard ? "/" : "#como-funciona"}>Cómo funciona</a>
          <a href={isDashboard ? "/#metodologia" : "#metodologia"}>Metodología</a>
          <a href={isDashboard ? "/#fuentes" : "#fuentes"}>Fuentes</a>
        </nav>
        <div className="geoq-navbar-actions">
          <span className="geoq-navbar-districts"><i />15 distritos · Cochabamba</span>
          {isDashboard ? (
            <nav className="geoq-navbar-view-switch" aria-label="Vistas principales">
              <button type="button" aria-pressed={activeView === "map"} onClick={() => onViewChange?.("map")}>Mapa</button>
              <button type="button" aria-pressed={activeView === "analytics"} onClick={() => onViewChange?.("analytics")}>Analítica</button>
            </nav>
          ) : (
            <a className="geoq-navbar-cta" href="/dashboard">Explorar tablero <Icon name="arrow_forward" /></a>
          )}
          {trailing}
        </div>
      </header>
    </>
  );
}
