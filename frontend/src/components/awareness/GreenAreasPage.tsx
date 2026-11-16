import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { GeoQochaNavbar } from "../navigation/GeoQochaNavbar";
import "./green-areas.css";

type IconName =
  | "air"
  | "arrow_forward"
  | "campaign"
  | "description"
  | "eco"
  | "forest"
  | "gavel"
  | "groups"
  | "health_and_safety"
  | "location_city"
  | "park"
  | "play_circle"
  | "satellite_alt"
  | "send"
  | "shield"
  | "thermostat"
  | "travel_explore"
  | "verified"
  | "volunteer_activism"
  | "volume_up"
  | "water_drop";

function Icon({ name }: { name: IconName }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;
}

function LoopingGreenAreasVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [volume, setVolume] = useState(0);

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
    }
  };

  return (
    <div className="green-video-player">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        preload="auto"
        playsInline
        aria-label="Video: Cochabamba, parques de la ciudad"
      >
        <source src="/media/cochabamba-parques-de-la-ciudad.mp4" type="video/mp4" />
        Tu navegador no puede reproducir este video. Puedes descargarlo en{" "}
        <a href="/media/cochabamba-parques-de-la-ciudad.mp4">este enlace</a>.
      </video>
      <label className="green-video-volume">
        <Icon name="volume_up" />
        <span>Volumen</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => handleVolumeChange(Number(event.target.value))}
          aria-label="Volumen del video"
        />
      </label>
    </div>
  );
}

const AWARENESS_CARDS = [
  {
    icon: "thermostat" as IconName,
    title: "Más sombra, menos calor",
    text: "Los árboles ubicados estratégicamente pueden enfriar el aire entre 2 y 8 °C y reducir las islas de calor que generan el asfalto y el cemento.",
    source: "Los Tiempos, 26/12/2024",
  },
  {
    icon: "air" as IconName,
    title: "Aire más limpio",
    text: "Un árbol urbano puede absorber hasta 150 kg de gases contaminantes al año y retener polvo y partículas finas que afectan las vías respiratorias.",
    source: "Los Tiempos, 26/12/2024",
  },
  {
    icon: "water_drop" as IconName,
    title: "Agua y suelo protegidos",
    text: "La vegetación regula el flujo de agua, mejora la infiltración y ayuda a prevenir inundaciones y deslizamientos en las cuencas urbanas.",
    source: "Los Tiempos, 26/12/2024",
  },
  {
    icon: "health_and_safety" as IconName,
    title: "Salud física y mental",
    text: "Vivir cerca de espacios verdes mejora la salud física y emocional. Los parques también son refugio de fauna y conectan corredores biológicos urbanos.",
    source: "UMSS, 2023 · Los Tiempos, 26/12/2024",
  },
  {
    icon: "location_city" as IconName,
    title: "Cochabamba, ciudad jardín",
    text: "El crecimiento urbano desordenado avanza sobre tierras agrícolas y áreas ecológicas. Cada espacio verde recuperado es una defensa frente al cemento.",
    source: "Los Tiempos, 26/05/2025",
  },
  {
    icon: "groups" as IconName,
    title: "La ciudadanía ya quiere actuar",
    text: "El 98,1 % de las personas encuestadas en el Área Metropolitana Kanata está dispuesta a plantar y cuidar árboles; el 83,4 % denunciaría la tala.",
    source: "Ecobarómetro de Ciudadanía, 2024",
  },
];

const STATS = [
  {
    value: "5,67 m²",
    label: "de área verde por habitante",
    detail: "Promedio municipal. La OMS recomienda 15 m² ideales y un mínimo de 9 m² por habitante.",
    source: "Plan Maestro de Forestación y Reforestación, 2016 · Los Tiempos, 26/12/2024",
  },
  {
    value: "2,58 %",
    label: "de cobertura arbórea en Cercado",
    detail: "La mancha urbana presenta un 42 % de suelo artificial: edificios, calles, distribuidores y viviendas.",
    source: "Plan Maestro de Forestación y Reforestación, 2016 · Los Tiempos, 26/12/2024",
  },
  {
    value: "3 m²",
    label: "por habitante en tres comunas del sur",
    detail: "Itocta, Alejo Calatayud y Valle Hermoso están muy por debajo del mínimo. Adela Zamudio es la única que supera 9 m² (9,61 m²).",
    source: "Los Tiempos, 26/12/2024",
  },
  {
    value: "98,1 %",
    label: "dispuesto a plantar y cuidar árboles",
    detail: "El 12,6 % del Área Metropolitana Kanata considera la deforestación el tercer problema ambiental más urgente.",
    source: "Ecobarómetro de Ciudadanía, 2024 · Sumando Voces",
  },
  {
    value: "1 millón",
    label: "de árboles nativos en el Tunari",
    detail: "Reforestación acumulada en 400 hectáreas durante cinco años, en siete municipios del valle.",
    source: "Opinión, 22/02/2025 · Asociación Civil Armonía",
  },
  {
    value: "1 millón",
    label: "de plantines para 2024–2025",
    detail: "Meta de la campaña en la ladera sur del Tunari. La siembra inmediata contempla 220 mil plantines en 14 comunidades de seis municipios.",
    source: "La Región, 06/12/2024",
  },
];

const NEWS = [
  {
    date: "26/12/2024",
    outlet: "Los Tiempos",
    title: "Cercado tiene 42 % de suelo artificial y solo 2,58 % de cobertura arbórea",
    summary: "El Plan Maestro de Forestación advierte un déficit de vegetación y una relación de 5,67 m² de área verde por habitante, frente a los 15 m² recomendados por la OMS.",
    href: "https://www.lostiempos.com/actualidad/cochabamba/20241226/cercado-tiene-42-suelo-artificial-solo-258-cobertura-arborea",
  },
  {
    date: "14/07/2024",
    outlet: "Opinión",
    title: "Avasallamientos amenazan áreas protegidas en la ciudad; hay leyes",
    summary: "La serranía de San Pedro, el Parque Nacional Tunari y Quenamari enfrentan asentamientos ilegales. La Ley Municipal 1421/2024 busca ordenar la gestión de las áreas protegidas municipales.",
    href: "https://www.opinion.com.bo/articulo/cochabamba/avasallamientos-amenazan-areas-protegidas-ciudad-leyes/20240714000028950362.html",
  },
  {
    date: "26/05/2025",
    outlet: "Los Tiempos",
    title: "Crecimiento urbano desordenado: el laberinto de Cochabamba",
    summary: "El avance de barrios sobre el Tunari y antiguos campos de cultivo genera deforestación y pérdida de recarga hídrica. El artículo reclama escudos verdes y planificación metropolitana.",
    href: "https://www.lostiempos.com/oh/actualidad/20250526/crecimiento-urbano-desordenado-laberinto-cochabamba",
  },
  {
    date: "27/10/2025",
    outlet: "El Deber",
    title: "Avasallamientos y falta de educación ambiental acechan a las áreas verdes urbanas",
    summary: "Especialistas señalan que los espacios verdes urbanos ceden ante el crecimiento desordenado. En Cochabamba, el avance del asfalto amenaza los bordes del Parque Tunari.",
    href: "https://eldeber.com.bo/educacion-y-sociedad/avasallamientos-falta-educacion-ambiental-acechan-areas-verdes-urbanas_1761570723",
  },
  {
    date: "17/10/2025",
    outlet: "El Deber",
    title: "Inician campaña de limpieza y reforestación de la cuenca del río Rocha",
    summary: "Instituciones, unidades educativas, empresarios, el ejército y voluntarios trabajaron en el río Tolavi, afluente del Rocha, para recuperar uno de los sistemas hídricos del valle.",
    href: "https://eldeber.com.bo/pais/cochabamba-inician-campana-limpieza-reforestacion-cuenca-rio-rocha_1760733162",
  },
  {
    date: "22/02/2025",
    outlet: "Opinión",
    title: "Logran reforestación con 1 millón de árboles nativos en 400 hectáreas del Tunari",
    summary: "El hito se alcanzó tras cinco años de trabajo en Tiquipaya, Sipe Sipe, Quillacollo, Vinto, Cochabamba, Sacaba y Colomi, con participación comunitaria.",
    href: "https://www.opinion.com.bo/articulo/cochabamba/logran-reforestacion-1-millon-arboles-nativos-400-hectareas-parque-tunari/20250222084738967444.html",
  },
];

const LAWS = [
  {
    number: "Ley Municipal N.º 235/2017",
    title: "Ley del Arbolado Público",
    scope: "Municipal",
    text: "Protege el arbolado de calles, avenidas, plazas, parques y áreas verdes de dominio público. La tala solo se permite cuando sea la única alternativa viable y tras una inspección técnica de la autoridad competente. Su artículo 18 sanciona la tala o daño sin autorización.",
    source: "Promulgada el 03/10/2017 · Reglamentada por Decreto Municipal 111/2018",
  },
  {
    number: "Ley Municipal N.º 1421/2024",
    title: "Gestión de Áreas Protegidas Municipales",
    scope: "Municipal",
    text: "Establece el marco para conservar ecosistemas, biodiversidad, recursos hídricos y funciones ecosistémicas de las áreas protegidas municipales. Define las Áreas Protegidas Municipales (APM), sus categorías, control y vigilancia.",
    source: "Promulgada el 20/02/2024 · Concejo Municipal de Cochabamba",
  },
  {
    number: "Ordenanzas 702/1968, 520/1989 y 1064/1993",
    title: "Protección de la serranía San Pedro",
    scope: "Municipal",
    text: "Declaran la serranía de dominio municipal, la reconocen como zona de preservación ecológica y de atracción turística, e instruyen un plan maestro para su implementación. El Plan Director de Espacios Verdes prohíbe construir en ella.",
    source: "Concejo Municipal de Cochabamba · recopilado por Opinión, 14/07/2024",
  },
  {
    number: "Ordenanza Municipal N.º 2858/2002",
    title: "Plan Director de la Región Urbana",
    scope: "Municipal",
    text: "Revalida el PDRUC y define usos y ocupación del suelo. La serranía San Pedro se mantiene como zona de preservación ecológica y grandes equipamientos con zonas verdes y parques.",
    source: "Concejo Municipal de Cochabamba",
  },
  {
    number: "Leyes nacionales 071, 300 y 482",
    title: "Marco de la Madre Tierra y autonomías",
    scope: "Nacional",
    text: "La Ley 071 reconoce los derechos de la Madre Tierra; la Ley 300 establece el marco de desarrollo integral; la Ley 482 define plazas, parques, bosques públicos, áreas protegidas y áreas verdes como bienes municipales de dominio público.",
    source: "Estado Plurinacional de Bolivia",
  },
  {
    number: "Ley Departamental N.º 267",
    title: "Prioridad de forestación en el Tunari",
    scope: "Departamental",
    text: "Prioriza campañas de forestación en áreas críticas como el Parque Nacional Tunari, vital para el suministro de agua de más de un millón de habitantes del valle.",
    source: "Gobierno Autónomo Departamental de Cochabamba · La Región, 06/12/2024",
  },
];

const DISTRICTS = Array.from({ length: 15 }, (_, index) => index + 1);

const ACTIVITIES = [
  "Plantado de árboles nativos",
  "Riego y mantenimiento de plantines",
  "Recuperación de parques y plazas",
  "Educación y concientización ambiental",
  "Mapeo y monitoreo de áreas verdes",
];

function SectionHeading({
  id,
  kicker,
  title,
  description,
  centered = false,
}: {
  id: string;
  kicker: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={`landing-section-heading ${centered ? "landing-heading-centered" : "landing-heading-narrow"}`}>
      <span className="landing-kicker">{kicker}</span>
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function GreenAreasPage() {
  const [registration, setRegistration] = useState<{ name: string; district: string } | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setRegistration({
      name: String(data.get("name") ?? "").trim(),
      district: String(data.get("district") ?? ""),
    });
    event.currentTarget.reset();
  };

  return (
    <div className="landing-page green-page">
      <GeoQochaNavbar variant="landing" activeNav="areas-verdes" />

      <main>
        <section className="green-hero" aria-labelledby="green-hero-title">
          <div className="landing-grid-pattern" />
          <div className="landing-container green-hero-grid">
            <div className="green-hero-copy">
              <span className="landing-provenance"><Icon name="forest" /> Defensa verde · 15 distritos · Cochabamba</span>
              <h1 id="green-hero-title">Frenemos la deforestación de las áreas verdes de Cochabamba.</h1>
              <p>
                Cada árbol talado en una plaza, acera o ladera reduce sombra, limpia menos aire y acerca el calor a los barrios.
                Proteger y recuperar nuestros espacios verdes es una tarea de toda la ciudad.
              </p>
              <div className="green-hero-actions">
                <a className="landing-button" href="#voluntariado"><Icon name="volunteer_activism" /> Quiero ser voluntario</a>
                <a className="landing-button landing-button-secondary" href="#normativa"><Icon name="gavel" /> Conocer la normativa</a>
              </div>
              <p className="green-hero-note">
                <Icon name="travel_explore" /> Datos de referencia externa: esta vista no forma parte del dataset NASA del tablero.
              </p>
            </div>

            <aside className="green-hero-panel" aria-label="Indicadores de referencia sobre áreas verdes">
              <div className="green-hero-panel-head">
                <span><Icon name="park" /> Semáforo verde</span>
                <small>Referencia municipal</small>
              </div>
              <p className="green-hero-score">5,67 <span>m²/hab</span></p>
              <p className="green-hero-target">Meta OMS: 15 m²/hab · mínimo 9 m²/hab</p>
              <div className="green-progress" role="img" aria-label="Cobertura actual de 38 por ciento de la meta ideal">
                <span />
              </div>
              <ul className="green-hero-facts">
                <li><strong>2,58 %</strong><span>cobertura arbórea en Cercado</span></li>
                <li><strong>42 %</strong><span>de la mancha urbana es suelo artificial</span></li>
                <li><strong>3 m²</strong><span>por habitante en comunas del sur</span></li>
              </ul>
              <small className="green-source">Fuente: Plan Maestro de Forestación y Reforestación, 2016 · Los Tiempos, 26/12/2024</small>
            </aside>
          </div>
        </section>

        <section className="green-section" aria-labelledby="green-awareness-title">
          <div className="landing-container">
            <SectionHeading
              id="green-awareness-title"
              kicker="CONCIENTIZACIÓN"
              title="Cuando perdemos un árbol, perdemos ciudad."
              description="Las áreas verdes no son un adorno: son infraestructura viva que enfría, limpia, protege y conecta la vida urbana."
            />
            <div className="green-card-grid">
              {AWARENESS_CARDS.map((card) => (
                <article className="green-awareness-card" key={card.title}>
                  <span className="green-card-icon"><Icon name={card.icon} /></span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <small>Fuente: {card.source}</small>
                </article>
              ))}
            </div>
            <p className="green-callout">
              <Icon name="campaign" />
              <span>
                Denunciar una tala sin autorización, cuidar el árbol de tu acera y sumarte a una reforestación con especies nativas
                son acciones concretas. La normativa existe: exigir su cumplimiento también protege.
              </span>
            </p>
          </div>
        </section>

        <section className="green-section green-section-muted" aria-labelledby="green-stats-title">
          <div className="landing-container">
            <SectionHeading
              id="green-stats-title"
              kicker="ESTADÍSTICAS DE REFERENCIA"
              title="Cochabamba está por debajo de lo mínimo recomendado."
              description="Cifras publicadas por el municipio, la UMSS, encuestas ciudadanas y prensa local. Cada dato indica su año y fuente."
            />
            <div className="green-stats-grid">
              {STATS.map((stat) => (
                <article className="green-stat-card" key={stat.label}>
                  <p className="green-stat-value">{stat.value}</p>
                  <h3>{stat.label}</h3>
                  <p>{stat.detail}</p>
                  <small>{stat.source}</small>
                </article>
              ))}
            </div>
            <p className="green-disclaimer">
              Cifras de referencia externa. No se interpolan ni extrapolan valores y no sustituyen una medición oficial actualizada del GAMC.
            </p>
          </div>
        </section>

        <section className="green-section" aria-labelledby="green-news-title">
          <div className="landing-container">
            <SectionHeading
              id="green-news-title"
              kicker="PRENSA Y TERRITORIO"
              title="Hechos recientes que explican la urgencia."
              description="Resúmenes de noticias y reportajes sobre áreas verdes, avasallamientos y reforestación en Cochabamba y su región metropolitana."
            />
            <div className="green-news-grid">
              {NEWS.map((item) => (
                <article className="green-news-card" key={item.title}>
                  <div className="green-news-meta">
                    <span>{item.outlet}</span>
                    <time>{item.date}</time>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <a href={item.href} target="_blank" rel="noreferrer">Leer la nota <Icon name="arrow_forward" /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="green-section green-section-norm" id="normativa" aria-labelledby="green-law-title">
          <div className="landing-container">
            <SectionHeading
              id="green-law-title"
              kicker="NORMATIVA LOCAL Y NACIONAL"
              title="El territorio verde también se defiende con leyes."
              description="Resumen general, no asesoría legal, de las normas que delimitan y protegen áreas verdes, parques y áreas protegidas frente a recortes, avasallamientos y tala ilegal."
            />
            <div className="green-law-grid">
              {LAWS.map((law) => (
                <article className="green-law-card" key={law.number}>
                  <div className="green-law-top">
                    <span className="green-law-icon"><Icon name={law.scope === "Nacional" ? "shield" : "description"} /></span>
                    <span className="green-law-scope">{law.scope}</span>
                  </div>
                  <p className="green-law-number">{law.number}</p>
                  <h3>{law.title}</h3>
                  <p>{law.text}</p>
                  <small>{law.source}</small>
                </article>
              ))}
            </div>
            <div className="green-law-note">
              <Icon name="verified" />
              <p>
                ¿Ves una tala, un relleno o una construcción en un área verde? Documenta el lugar y acude a la Subalcaldía,
                al Concejo Municipal o a la Unidad de Gestión de Riesgos. La inspección técnica y la autorización previa son obligatorias.
              </p>
            </div>
          </div>
        </section>

        <section className="green-section green-section-video" aria-labelledby="green-video-title">
          <div className="landing-container green-video-layout">
            <div>
              <span className="landing-kicker">MULTIMEDIA</span>
              <h2 id="green-video-title">Cochabamba, parques de la ciudad.</h2>
              <p>
                Un recorrido por los espacios verdes que dan identidad al valle. Mirar la ciudad también es una forma de
                reconocer lo que debemos cuidar.
              </p>
              <div className="green-video-facts">
                <span><Icon name="play_circle" /> Video local del proyecto</span>
                <span><Icon name="park" /> Parques y áreas verdes urbanas</span>
              </div>
            </div>
             <div className="green-video-frame">
               <LoopingGreenAreasVideo />
             </div>
          </div>
        </section>

        <section className="green-section green-section-volunteer" id="voluntariado" aria-labelledby="green-volunteer-title">
          <div className="landing-container green-volunteer-layout">
            <div className="green-volunteer-copy">
              <span className="landing-kicker">VOLUNTARIADO CIUDADANO</span>
              <h2 id="green-volunteer-title">Plantemos el próximo árbol de tu distrito.</h2>
              <p>
                Súmate a jornadas de plantado, riego y recuperación de espacios verdes. Este formulario es una demostración
                interactiva: no envía datos a ningún servidor ni reemplaza una convocatoria oficial.
              </p>
              <ul className="green-volunteer-list">
                <li><Icon name="eco" /> Especies nativas y riego responsable</li>
                <li><Icon name="groups" /> Jornadas por distrito y con vecinos</li>
                <li><Icon name="shield" /> Seguimiento para que el árbol crezca</li>
              </ul>
            </div>

            <div className="green-volunteer-card">
              {registration ? (
                <div className="green-form-success" role="status" aria-live="polite">
                  <Icon name="verified" />
                  <h3>Registro de ejemplo generado</h3>
                  <p>
                    Gracias, <strong>{registration.name || "vecino o vecina"}</strong>. Tu interés quedó asociado al
                    Distrito {registration.district}. Esta demo no envió ni almacenó información personal.
                  </p>
                  <button type="button" className="landing-button" onClick={() => setRegistration(null)}>
                    Registrar otra persona
                  </button>
                </div>
              ) : (
                <form className="green-volunteer-form" onSubmit={handleSubmit}>
                  <div className="green-form-head">
                    <span><Icon name="volunteer_activism" /> Formulario de voluntariado</span>
                    <small>Ejemplo interactivo sin envío real</small>
                  </div>
                  <label className="green-field">
                    <span>Nombre completo</span>
                    <input name="name" type="text" autoComplete="name" required placeholder="Tu nombre" />
                  </label>
                  <label className="green-field">
                    <span>Correo electrónico</span>
                    <input name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" />
                  </label>
                  <label className="green-field">
                    <span>Teléfono (opcional)</span>
                    <input name="phone" type="tel" autoComplete="tel" placeholder="+591 700 00000" />
                  </label>
                  <label className="green-field">
                    <span>Distrito</span>
                    <select name="district" required defaultValue="">
                      <option value="" disabled>Selecciona tu distrito</option>
                      {DISTRICTS.map((district) => (
                        <option key={district} value={district}>Distrito {district}</option>
                      ))}
                    </select>
                  </label>
                  <label className="green-field">
                    <span>Actividad de interés</span>
                    <select name="activity" required defaultValue="">
                      <option value="" disabled>Selecciona una actividad</option>
                      {ACTIVITIES.map((activity) => (
                        <option key={activity} value={activity}>{activity}</option>
                      ))}
                    </select>
                  </label>
                  <label className="green-field">
                    <span>Disponibilidad</span>
                    <select name="availability" required defaultValue="">
                      <option value="" disabled>Selecciona una opción</option>
                      <option value="fin-de-semana">Fines de semana</option>
                      <option value="entre-semana">Entre semana</option>
                      <option value="flexible">Horario flexible</option>
                    </select>
                  </label>
                  <label className="green-consent">
                    <input name="consent" type="checkbox" required />
                    <span>Acepto que mis datos se usen solo para coordinar esta actividad de ejemplo.</span>
                  </label>
                  <button className="landing-button green-submit" type="submit">
                    Enviar registro <Icon name="send" />
                  </button>
                  <p className="green-form-note">
                    No ingreses datos sensibles. GeoQocha no guarda conversaciones ni registros de voluntariado en esta demo.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <a className="geoq-navbar-brand" href="/" aria-label="GeoQocha, inicio">
            <span className="geoq-navbar-brand-icon"><Icon name="satellite_alt" /></span>
            <span><strong>GeoQocha</strong><small>VALLE CENTRAL DE COCHABAMBA</small></span>
          </a>
          <span>Datos de referencia externa · Código abierto</span>
          <span>Defensa verde · Licencia MIT</span>
        </div>
      </footer>
    </div>
  );
}
