import type { ReactNode } from "react";
import { GeoQochaNavbar } from "./components/navigation/GeoQochaNavbar";

type IconName =
  | "arrow_forward"
  | "satellite_alt"
  | "travel_explore"
  | "hub"
  | "thermostat"
  | "balance"
  | "psychology"
  | "analytics"
  | "apartment"
  | "fmd_bad"
  | "neurology"
  | "satellite"
  | "layers"
  | "calculate"
  | "forum"
  | "verified"
  | "menu_book";

function Icon({ name }: { name: IconName }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;
}

function MiniMap() {
  return (
    <div className="landing-map-card" aria-label="Vista previa ilustrativa del mapa de distritos">
      <div className="landing-map-toolbar">
        <span><i className="status-dot" /> MALLA TERRITORIAL · VALLE DE COCHABAMBA</span>
        <span>EPSG:4326 · WGS84</span>
      </div>
      <div className="landing-map-canvas">
        <svg viewBox="0 0 600 420" role="img" aria-label="Mapa ilustrativo de distritos de Cochabamba">
          <path d="M0 92Q100 24 190 76T370 42T600 88V0H0Z" fill="#213348" opacity=".72" />
          <path d="M0 142Q130 78 250 120T480 92L600 138V82H0Z" fill="#2c4960" opacity=".55" />
          <path d="M12 250Q125 220 252 254T430 236T592 276" fill="none" stroke="#38bdf8" strokeDasharray="5 4" strokeWidth="3" opacity=".9" />
          <polygon className="map-zone map-zone-green" points="118,92 214,104 230,164 138,151" />
          <polygon className="map-zone map-zone-green" points="46,136 132,145 120,201 36,190" />
          <polygon className="map-zone map-zone-yellow" points="140,160 232,165 241,218 149,210" />
          <polygon className="map-zone map-zone-green" points="238,141 332,132 350,187 246,193" />
          <polygon className="map-zone map-zone-green" points="342,122 451,112 470,172 358,183" />
          <polygon className="map-zone map-zone-red" points="248,202 329,196 334,253 252,258" />
          <polygon className="map-zone map-zone-orange" points="337,198 424,187 432,247 340,253" />
          <polygon className="map-zone map-zone-blue" points="359,260 451,254 482,313 379,321" />
          <ellipse cx="410" cy="286" rx="36" ry="21" fill="#0369a1" stroke="#7dd3fc" />
          <polygon className="map-zone map-zone-red" points="224,270 340,264 330,343 211,333" />
          <polygon className="map-zone map-zone-orange" points="122,275 212,269 202,354 111,342" />
          <polygon className="map-zone map-zone-red" points="340,332 461,328 451,397 330,392" />
          <g className="map-labels">
            <text x="161" y="132">D-1</text><text x="77" y="169">D-2</text>
            <text x="180" y="193">D-3</text><text x="281" y="168">D-4</text>
            <text x="400" y="151">D-12</text><text x="278" y="234">D-10</text>
            <text x="374" y="228">D-11</text><text x="262" y="306">D-9</text>
            <text x="146" y="315">D-8</text><text x="381" y="368">D-14</text>
          </g>
        </svg>
        <div className="map-chip map-chip-top"><i className="chip-dot chip-dot-red" /><span><small>DISTRITO 10 · DEMO</small><b>ICVSA: ilustrativo</b></span></div>
        <div className="map-chip map-chip-right"><i className="chip-dot chip-dot-green" /><span>D-12: NDVI ilustrativo</span></div>
        <div className="map-chip map-chip-bottom"><i className="chip-dot chip-dot-yellow" /><span><small>DISTRITO 3 · DEMO</small><b>LST: valor ilustrativo</b></span></div>
        <div className="map-legend">
          <span><i className="legend-green" /> Vegetación</span>
          <span><i className="legend-yellow" /> Atención</span>
          <span><i className="legend-red" /> Calor</span>
        </div>
      </div>
      <div className="landing-map-footer">
        <span>Vista previa del tablero</span>
        <strong>15/15 distritos configurados</strong>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  eyebrow,
  title,
  children,
  accent,
  footer,
}: {
  icon: IconName;
  eyebrow: string;
  title: string;
  children: ReactNode;
  accent: string;
  footer: string;
}) {
  return (
    <article className={`landing-feature-card ${accent}`}>
      <div className="feature-card-top">
        <span className="feature-icon"><Icon name={icon} /></span>
        <span className="feature-eyebrow">{eyebrow}</span>
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      <div className="feature-card-footer"><span>{footer}</span><Icon name="verified" /></div>
    </article>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <GeoQochaNavbar variant="landing" />

      <main>
        <section className="landing-hero">
          <div className="landing-grid-pattern" />
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <img className="landing-hero-emblem" src="/brand/logo-escudo.webp" alt="Escudo de Cochabamba" />
              <span className="landing-provenance"><Icon name="travel_explore" /> NASA MODIS · Datos municipales GAMC · 2015–2025</span>
              <h1>Comprende cómo cambia Cochabamba desde el espacio.</h1>
              <p>Explora la vegetación, la temperatura superficial, el equipamiento urbano y las tendencias socioambientales de los 15 distritos municipales.</p>
              <div className="landing-hero-actions">
                <a className="landing-button" href="/dashboard">Explorar el tablero <Icon name="arrow_forward" /></a>
                <a className="landing-button landing-button-secondary" href="#como-funciona"><Icon name="menu_book" /> Conocer GeoQocha</a>
              </div>
              <div className="landing-telemetry">
                <span><small>DISTRITOS</small><b>15</b></span>
                <span><small>HORIZONTE</small><b>10 años</b></span>
                <span><small>VARIABLES</small><b>NDVI · LST</b></span>
              </div>
            </div>
            <MiniMap />
          </div>
        </section>

        <section className="landing-section landing-problem">
          <div className="landing-container">
            <div className="landing-section-heading landing-heading-narrow">
              <span className="landing-kicker">DIAGNÓSTICO TERRITORIAL</span>
              <h2>Los datos existen, pero no siempre son fáciles de entender.</h2>
              <p>GeoQocha conecta información satelital y municipal para convertirla en evidencia visual, transparente y comprensible.</p>
            </div>
            <div className="landing-problem-grid">
              <FeatureCard icon="hub" eyebrow="01 · INFORMACIÓN" title="Datos dispersos" accent="feature-green" footer="Fuentes que necesitan contexto">Información NASA y capas municipales que suelen estar aisladas en formatos técnicos difíciles de explorar.</FeatureCard>
              <FeatureCard icon="thermostat" eyebrow="02 · CAMBIO" title="Cambios difíciles de observar" accent="feature-amber" footer="Brecha temporal 2015–2025">La pérdida de vegetación y las islas de calor se vuelven visibles al observar una serie histórica.</FeatureCard>
              <FeatureCard icon="balance" eyebrow="03 · DECISIONES" title="Contexto para actuar" accent="feature-blue" footer="Evidencia territorial abierta">Ciudadanía, comunidades e instituciones necesitan comparar distritos con información verificable.</FeatureCard>
            </div>
          </div>
        </section>

        <section className="landing-section landing-capabilities">
          <div className="landing-container">
            <div className="landing-section-heading landing-heading-centered">
              <span className="landing-kicker">INDICADORES MULTIDIMENSIONALES</span>
              <h2>Una mirada completa a cada distrito.</h2>
              <p>Métricas comparables para entender el territorio cochabambino sin perder de vista las fuentes y sus limitaciones.</p>
            </div>
            <div className="landing-feature-grid">
              <FeatureCard icon="psychology" eyebrow="MODIS · 250 M" title="Vegetación (NDVI)" accent="feature-green" footer="Series históricas de cobertura vegetal">Observa cómo cambia la cobertura vegetal mediante una serie temporal anual.</FeatureCard>
              <FeatureCard icon="thermostat" eyebrow="TEMPERATURA" title="Temperatura superficial (LST)" accent="feature-amber" footer="Detección de islas de calor">Identifica zonas con mayor exposición térmica. La LST representa superficie, no temperatura del aire.</FeatureCard>
              <FeatureCard icon="analytics" eyebrow="ESCALA 1–100" title="Índice socioambiental (ICVSA)" accent="feature-green" footer="Semaforización territorial">Consulta un indicador sintético histórico con pesos, año de referencia y sensibilidad visibles.</FeatureCard>
              <FeatureCard icon="apartment" eyebrow="CAPAS MUNICIPALES" title="Equipamiento y movilidad" accent="feature-blue" footer="Proximidad y cobertura">Explora áreas verdes, salud, educación y transporte como contexto territorial.</FeatureCard>
              <FeatureCard icon="fmd_bad" eyebrow="REGLAS EXPLÍCITAS" title="Hotspots explicables" accent="feature-red" footer="Trazabilidad lógica">Conoce qué variables y reglas activan cada señal de atención.</FeatureCard>
              <FeatureCard icon="neurology" eyebrow="COPILOTO ACOTADO" title="Copiloto GeoQocha" accent="feature-slate" footer="Lenguaje natural con citas">Obtén explicaciones sencillas basadas en datos precalculados, fuentes y advertencias.</FeatureCard>
            </div>
          </div>
        </section>

        <section className="landing-section landing-how" id="como-funciona">
          <div className="landing-container">
            <div className="landing-section-heading landing-heading-narrow">
              <span className="landing-kicker">TRAZABILIDAD DE DATOS</span>
              <h2>Cómo funciona: de los sensores a tu barrio.</h2>
              <p>Un flujo técnico transparente que convierte observaciones en conocimiento territorial comprensible.</p>
            </div>
            <div className="landing-steps">
              <div className="landing-step"><span>01</span><Icon name="satellite" /><h3>Observamos</h3><p>Procesamos observaciones satelitales NASA para NDVI y LST.</p><small>NDVI · LST · QA</small></div>
              <div className="landing-step"><span>02</span><Icon name="layers" /><h3>Integramos</h3><p>Relacionamos las capas municipales y las geometrías de los 15 distritos.</p><small>15 polígonos distritales</small></div>
              <div className="landing-step"><span>03</span><Icon name="calculate" /><h3>Analizamos</h3><p>Construimos tendencias, brechas, ICVSA y hotspots con reglas publicadas.</p><small>Pesos y umbrales visibles</small></div>
              <div className="landing-step"><span>04</span><Icon name="forum" /><h3>Explicamos</h3><p>Presentamos mapas, gráficos y explicaciones con fuentes y limitaciones.</p><small>Acceso ciudadano abierto</small></div>
            </div>
            <div className="landing-method-callout" id="metodologia">
              <Icon name="verified" />
              <div><strong>Metodología visible</strong><p>El ICVSA separa nivel, tendencia y brecha; los datos faltantes se muestran como “No disponible” y no se imputan como cero.</p></div>
              <a href="/dashboard?panel=methodology">Ver metodología <Icon name="arrow_forward" /></a>
            </div>
          </div>
        </section>

        <section className="landing-section landing-final" id="fuentes">
          <div className="landing-container landing-final-inner">
            <div>
              <span className="landing-kicker">CIENCIA ABIERTA PARA COCHABAMBA</span>
              <h2>Mira tu ciudad con más contexto.</h2>
              <p>Explora los 15 distritos, compara sus tendencias y descubre qué historias cuentan los datos.</p>
            </div>
            <a className="landing-button" href="/dashboard">Explorar GeoQocha <Icon name="arrow_forward" /></a>
            <img className="landing-final-slogan" src="/brand/logo-slogan.webp" alt="GeoQocha, ciencia abierta para Cochabamba" />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <span className="landing-footer-municipal">
            <img src="/brand/logo-escudo.webp" alt="Escudo de Cochabamba" />
            Cochabamba, Bolivia
          </span>
          <a className="geoq-navbar-brand" href="/" aria-label="GeoQocha, inicio">
            <span className="geoq-navbar-brand-icon"><img src="/brand/logo-geoqocha.png" alt="" /></span>
            <span><strong>GeoQocha</strong><small>VALLE CENTRAL DE COCHABAMBA</small></span>
          </a>
          <span>NASA MODIS · GAMC · Código abierto</span>
          <span>Datos ilustrativos en la demo · Licencia MIT</span>
        </div>
      </footer>
    </div>
  );
}
