import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface GeoQochaNavbarProps {
  variant: "landing" | "dashboard";
  activeNav?: "areas-verdes";
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
  activeNav,
  trailing,
}: GeoQochaNavbarProps) {
  const isDashboard = variant === "dashboard";

  return (
    <>
      <aside className="geoq-navbar-notice" aria-label="Aviso de validación técnica">
        <span><Icon name="travel_explore" /> Demo con serie complementada</span>
        <small>Los resultados deben validarse con fuentes oficiales NASA y GAMC.</small>
      </aside>
      <header className="geoq-navbar">
        <Brand />
        <nav className="geoq-navbar-links" aria-label="Navegación principal">
          <a href="/#como-funciona">Cómo funciona</a>
          <a href="/areas-verdes" aria-current={activeNav === "areas-verdes" ? "page" : undefined}>Áreas Verdes</a>
        </nav>
        <div className="geoq-navbar-actions">
          <span className="geoq-navbar-districts"><i />15 distritos · Cochabamba</span>
          {!isDashboard && (
            <a className="geoq-navbar-cta" href="/dashboard">Explorar tablero <Icon name="arrow_forward" /></a>
          )}
          <ThemeToggle />
          {trailing}
        </div>
      </header>
    </>
  );
}
