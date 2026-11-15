import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

export type GeoQochaView = "map" | "analytics";

interface GeoQochaNavbarProps {
  variant: "landing" | "dashboard";
  activeView?: GeoQochaView;
  activeNav?: "areas-verdes";
  onViewChange?: (view: GeoQochaView) => void;
  trailing?: ReactNode;
}

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;
}

function Brand() {
  return (
    <a className="geoq-navbar-brand" href="/" aria-label="GeoQocha, inicio">
      <span className="geoq-navbar-brand-icon"><img src="/brand/logo-geoqocha.png" alt="" /></span>
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
  activeNav,
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
          <a href="/#como-funciona">Cómo funciona</a>
          <a href="/#metodologia">Metodología</a>
          <a href="/#fuentes">Fuentes</a>
          <a href="/areas-verdes" aria-current={activeNav === "areas-verdes" ? "page" : undefined}>Áreas Verdes</a>
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
          <ThemeToggle />
          {trailing}
        </div>
      </header>
    </>
  );
}
