import { useState } from "react";

const indicators = [
  { value: "15", label: "distritos conectados", tone: "green" },
  { value: "2015–2025", label: "años de observación", tone: "lime" },
  { value: "1–100", label: "escala del ICVSA", tone: "orange" },
];

const features = [
  {
    number: "01",
    title: "Observa el territorio",
    text: "Explora un mapa vivo con NDVI, temperatura superficial y las capas urbanas que dan contexto a cada distrito.",
    icon: "map",
  },
  {
    number: "02",
    title: "Entiende el cambio",
    text: "Sigue la evolución ambiental de 2015 a 2025 y descubre dónde la vegetación disminuye o el calor aumenta.",
    icon: "trend",
  },
  {
    number: "03",
    title: "Compara con evidencia",
    text: "Contrasta distritos, identifica brechas y consulta alertas explicables sin cajas negras.",
    icon: "layers",
  },
];

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M23.8 4.2C14.2 4.2 6.4 7.5 5.1 14.7c-.5 2.8.6 5.5 2.8 7.2 2.2 1.7 5.2 1.8 7.5.3 3.5-2.3 6.2-7.5 8.4-18Z" />
      <path d="M4 24c3.4-5.4 7.7-8.8 13.1-11.4" />
    </svg>
  );
}

function FeatureIcon({ type }: { type: string }) {
  if (type === "trend") {
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path d="M5 28.5h26M7 25l7-7 5 4 9-11" />
        <path d="M22.5 11H28v5.5" />
      </svg>
    );
  }
  if (type === "layers") {
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path d="m18 5 13 7-13 7-13-7 13-7Z" />
        <path d="m5 18 13 7 13-7M5 24l13 7 13-7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M18 5c-7.2 0-13 5.8-13 13s5.8 13 13 13 13-5.8 13-13S25.2 5 18 5Z" />
      <path d="M8.5 24.5c5-1 9-4.5 11.5-10.5M18 18l7-1" />
    </svg>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-page">
      <header className="site-header">
        <a className="brand" href="#inicio" onClick={closeMenu}>
          <span className="brand-mark"><LeafIcon /></span>
          <span>
            <strong>Cochabamba</strong>
            <em>Verde</em>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>

        <nav className={menuOpen ? "main-nav is-open" : "main-nav"}>
          <a href="#proyecto" onClick={closeMenu}>El proyecto</a>
          <a href="#metodo" onClick={closeMenu}>Cómo funciona</a>
          <a href="#datos" onClick={closeMenu}>Datos abiertos</a>
          <a className="nav-cta" href="#explorar" onClick={closeMenu}>Explorar tablero <ArrowIcon /></a>
        </nav>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-text">
            <p className="eyebrow"><span className="eyebrow-dot" /> Observatorio socioambiental de Cochabamba</p>
            <h1>Ver nuestra ciudad.<br /><span>Entender su cambio.</span></h1>
            <p className="hero-copy">
              Una nueva forma de leer Cochabamba a través de los datos de la NASA y del territorio que habitamos.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#explorar">Conoce el proyecto <ArrowIcon /></a>
              <a className="text-link" href="#metodo">Descubre cómo funciona <span aria-hidden="true">↓</span></a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Visualización abstracta del territorio y sus datos">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="map-shape">
              <div className="map-grid" />
              <div className="map-line line-one" />
              <div className="map-line line-two" />
              <div className="map-line line-three" />
              <span className="map-pin pin-one" />
              <span className="map-pin pin-two" />
              <span className="map-pin pin-three" />
              <span className="map-pin pin-four" />
            </div>
            <div className="visual-caption"><span className="pulse" /> Datos que cuentan una historia</div>
            <div className="visual-label label-top">NDVI <b>+12.4%</b></div>
            <div className="visual-label label-bottom">LST <b>29.5°C</b></div>
          </div>
        </section>

        <section className="stats-strip" aria-label="Datos destacados">
          {indicators.map((item) => (
            <div className={`stat-item ${item.tone}`} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
          <div className="stat-note">Un proyecto abierto<br />para una ciudad consciente.</div>
        </section>

        <section className="intro-section section-container" id="proyecto">
          <div className="section-kicker">La ciudad, en contexto</div>
          <div className="intro-grid">
            <h2>Los datos también<br /><span>pueden cuidar.</span></h2>
            <div className="intro-copy">
              <p>Cochabamba Verde integra observación satelital y datos municipales para hacer visible lo que cambia en nuestros distritos.</p>
              <p>Porque comprender dónde crece el calor, dónde se pierde la vegetación o dónde faltan servicios es el primer paso para conversar sobre un mejor futuro.</p>
            </div>
          </div>
        </section>

        <section className="feature-section" id="metodo">
          <div className="section-container">
            <div className="section-heading">
              <div>
                <div className="section-kicker">Una mirada completa</div>
                <h2>Del satélite<br /><span>a tu distrito.</span></h2>
              </div>
              <p>Información clara para descubrir patrones, comparar realidades y tomar mejores decisiones.</p>
            </div>
            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.number}>
                  <div className="feature-topline"><span>{feature.number}</span><FeatureIcon type={feature.icon} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                  <a href="#explorar" aria-label={`Conocer más sobre ${feature.title}`}>Conocer más <ArrowIcon /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="index-section section-container" id="datos">
          <div className="index-copy">
            <div className="section-kicker">Un lenguaje común</div>
            <h2>Una ciudad.<br /><span>Un índice para entenderla.</span></h2>
            <p>El ICVSA reúne vegetación, temperatura superficial, equipamiento y movilidad en una escala transparente de 1 a 100. Sin esconder los datos originales. Sin cajas negras.</p>
            <a className="button button-dark" href="#explorar">Conoce el ICVSA <ArrowIcon /></a>
          </div>
          <div className="index-card" aria-label="Ejemplo visual del Índice de Calidad de Vida Socio-Ambiental">
            <div className="index-card-head"><span>ICVSA</span><span className="index-year">2025</span></div>
            <div className="score-row"><strong>72</strong><span>/ 100</span></div>
            <div className="score-status"><i /> Condición relativa favorable</div>
            <div className="score-bar"><span /></div>
            <div className="score-foot"><span>Distrito 3</span><span>↑ 4.2% vs. 2015</span></div>
          </div>
        </section>

        <section className="cta-section" id="explorar">
          <div className="cta-pattern" />
          <div className="cta-content">
            <p className="eyebrow light"><span className="eyebrow-dot" /> Una herramienta para todos</p>
            <h2>La ciudad que<br /><span>queremos ver.</span></h2>
            <p>Explora el territorio, encuentra las historias detrás de los datos y sé parte de una conversación informada sobre Cochabamba.</p>
            <a className="button button-light" href="#inicio">Próximamente: explorar el tablero <ArrowIcon /></a>
          </div>
        </section>
      </main>

      <footer className="site-footer section-container">
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark"><LeafIcon /></span><span><strong>Cochabamba</strong><em>Verde</em></span></a>
        <p>Datos abiertos para una ciudad más consciente.</p>
        <span className="footer-meta">NASA Space Apps Challenge · 2026</span>
      </footer>
    </div>
  );
}

export { App };
