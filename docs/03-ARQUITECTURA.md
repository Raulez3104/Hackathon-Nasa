# 03 — Arquitectura

Diseño técnico propuesto para el MVP de **Cochabamba Verde**. Prioriza entrega rápida en hackathon, reproducibilidad del procesamiento y no exposición de credenciales del GAMC.

---

## 1. Visión general

```text
                  FUENTES DE DATOS
       ┌──────────────────┬──────────────────┐
       │ NASA MODIS       │ GAMC vectorial    │
       │ NDVI / LST       │ WMS / GeoJSON     │
       └────────┬─────────┴─────────┬────────┘
                │                   │
        Extracción y QA       Proxy seguro WMS
        Python / GEE          Node.js / Express
                │                   │
                ▼                   ▼
       Series distrito-año     Capas visuales +
       + ICVSA histórico       atributos puntuales
       + equipamiento/movilidad
                └────────┬──────────┘
                         ▼
                API propia / archivos
                procesados / base de datos
                         │
                         ▼
              React + TypeScript + Vite
          Leaflet + Recharts + mapas de calor
                         │
                         ▼
       Dashboard, fichas, comparador, hotspots
            y análisis de relación
```

### Principios de diseño

1. **Credenciales fuera del cliente.** Todo acceso al GAMC pasa por el backend.
2. **Datos procesados como contrato.** El frontend consume un esquema estable, no formatos crudos de NASA ni WMS.
3. **Degradación elegante.** Si el WMS falla, el mapa base y los indicadores siguen funcionando.
4. **Reproducibilidad.** El procesamiento satelital es un pipeline documentado y reejecutable.
5. **Trazabilidad.** Cada cifra enlaza a dataset, año y transformación.
6. **Simplicidad primero.** Archivos JSON/CSV/GeoJSON antes que base de datos para el MVP.

---

## 2. Componentes

### 2.1 Frontend

| Aspecto | Definición |
|---|---|
| Tecnología | React + TypeScript + Vite |
| Estilos | Tailwind CSS |
| Mapas | Leaflet + React Leaflet |
| Gráficos | Recharts |
| Estado | Estado local + fetch a la API propia (sin sobreingeniería) |
| Responsabilidad | Renderizar dashboard, mapas de calor, fichas, comparación, hotspots, análisis de relación y metodología |

**Estructura interna**

```text
frontend/src/
├── components/          # UI reutilizable (cards, selects, badges, legends)
├── pages/               # Dashboard, DistrictDetail, Comparison, Hotspots, Analysis, Methodology
├── features/
│   ├── map/             # Mapa base, coropletas, mapas de calor, capas WMS, selección
│   ├── districts/       # Ficha, series históricas, ICVSA, calidad de datos
│   ├── comparison/      # Comparador, brechas y alertas
│   └── analysis/        # Dispersión tendencia ambiental vs acceso
├── services/            # Cliente HTTP tipado de la API propia
├── types/               # Tipos compartidos del contrato de datos
└── utils/               # Formateo, escalas de color, cálculos de presentación
```

### 2.2 Backend

| Aspecto | Definición |
|---|---|
| Tecnología | Node.js + Express + TypeScript |
| Responsabilidad | Proxy WMS, API de indicadores, validación y caché |
| Persistencia MVP | Archivos JSON/CSV/GeoJSON en `data/processed` |
| Persistencia futura | PostgreSQL + PostGIS |

**Estructura interna**

```text
backend/src/
├── routes/              # Definición de endpoints
├── controllers/         # Manejo de request/response
├── services/
│   ├── gamc/            # Proxy WMS, lista blanca, GetFeatureInfo
│   └── indicators/      # Lectura, filtrado y agregación de indicadores
├── config/              # Variables de entorno y constantes
├── middleware/          # Validación, errores, caché, rate limit
└── types/               # Contratos internos
```

### 2.3 Procesamiento de datos

```text
data-processing/
├── nasa/                # Descarga/consulta MODIS, filtros QA, escalas
├── geospatial/          # Validación de GeoJSON, CRS, unión espacial
└── indicators/          # Estadísticas zonales, tendencias, índice
```

| Tarea | Herramienta sugerida |
|---|---|
| Estadística zonal NDVI/LST | Google Earth Engine o Python (rasterio/geopandas) |
| Validación de vectores GAMC | Python (geopandas, shapely) |
| Accesibilidad a equipamiento | Python (sjoin, distancias) o PostGIS |
| Tendencias y aceleración | Python (numpy/scipy, Mann-Kendall opcional) |
| Correlación exploratoria | Python (pandas, scipy.stats) |
| Construcción del ICVSA | Python o TypeScript en build de datos |
| Mapas de calor | Raster precalculado (PNG/GeoTIFF) o puntos agregados |

**Salidas del pipeline**

- `data/geojson/districts.geojson`
- `data/geojson/transport.geojson` (si está disponible)
- `data/processed/district_year.json` (o CSV), con ICVSA y sensibilidad
- `data/processed/trends.json` (pendiente, aceleración, significancia)
- `data/processed/equipment_metrics.json` (acceso y déficit por distrito)
- `data/processed/hotspots.json`
- `data/processed/correlations.json`
- `data/processed/heatmap_lst.json` (o tiles/raster)
- `data/metadata/sources.json` (incluye `territorial_reference_year`)

### 2.4 Capa de datos

| Carpeta | Contenido |
|---|---|
| `data/geojson/` | Geometrías validadas (distritos, transporte). |
| `data/processed/` | Series distrito-año, tendencias, hotspots, índice. |
| `data/metadata/` | Fuente, fecha, licencia, transformaciones, limitaciones. |

---

## 3. Stack recomendado

| Componente | Tecnología | Por qué |
|---|---|---|
| Frontend | React, TypeScript, Vite | Desarrollo rápido y componentes reutilizables |
| Estilos | Tailwind CSS | Diseño adaptable |
| Mapas | Leaflet, React Leaflet | WMS + GeoJSON + interacción |
| Mapas de calor | Leaflet.heat, capa raster o tiles precalculados | Islas de calor y severidad sin recalcular en el cliente |
| Gráficos | Recharts | Series históricas y comparaciones |
| Backend | Node.js, Express, TypeScript | Proxy seguro y API de indicadores |
| Procesamiento satelital | Python y/o Google Earth Engine | Extracción zonal, control de calidad y agregación |
| Datos MVP | JSON/CSV/GeoJSON procesados | Simplifica entrega rápida |
| Persistencia futura | PostgreSQL + PostGIS | Consultas y análisis espacial escalables |

---

## 4. Estructura del repositorio

```text
cochabamba-verde/
├── frontend/
│   ├── src/components/
│   ├── src/pages/
│   ├── src/features/map/
│   ├── src/features/districts/
│   ├── src/features/comparison/
│   ├── src/features/analysis/
│   └── src/services/
├── backend/
│   ├── src/routes/
│   ├── src/controllers/
│   ├── src/services/gamc/
│   ├── src/services/indicators/
│   └── src/config/
├── data-processing/
│   ├── nasa/
│   ├── geospatial/
│   └── indicators/
├── data/
│   ├── geojson/
│   ├── processed/
│   └── metadata/
├── docs/
├── .env.example
├── LICENSE
└── README.md
```

---

## 5. Flujos principales

### 5.1 Carga del dashboard

```text
Usuario → Frontend → GET /api/districts
                          ↓
                    backend lee districts.geojson
                          ↓
                    responde GeoJSON + resumen
                          ↓
Frontend → GET /api/districts/:id/indicators?from=2015&to=2025
                          ↓
                    backend lee district_year.json
                          ↓
                    responde serie NDVI, LST e ICVSA
                          ↓
Frontend → GET /api/heatmap?variable=lst&year=2025
                          ↓
                    backend sirve raster/puntos precalculados
                          ↓
     Leaflet dibuja coropletas y mapas de calor
              + Recharts series históricas
```

### 5.2 Proxy WMS

```text
Frontend → GET /api/gamc/wms?service_id=...&REQUEST=GetMap&...
                 ↓
        backend valida service_id (lista blanca),
        valida REQUEST, BBOX, WIDTH, HEIGHT, FORMAT
                 ↓
        añade key desde process.env.GAMC_API_KEY
                 ↓
        reenvía a https://serviciosgamc.cochabamba.bo/api/gs/wms
                 ↓
        devuelve PNG/JSON con caché y sin filtrar la clave
```

### 5.3 Procesamiento NASA (offline)

```text
GeoJSON distritos → validar CRS y topología
        ↓
MODIS MOD13Q1 / MOD11A2 (2015–2025)
        ↓
filtro QA + conversión de escala (LST a °C)
        ↓
estadística zonal por distrito y año (o mes)
        ↓
vectores GAMC → conteos y accesibilidad por distrito
        ↓
ICVSA: ambiente anual + territorio fijo en t_ref
        ↓
tendencias, aceleración y brechas vs promedio
        ↓
hotspots + correlación exploratoria + mapas de calor
        ↓
data/processed/*.json → backend
```

---

## 6. Decisiones de arquitectura

### AD-01 — Proxy backend para GAMC

**Decisión:** no consumir el WMS del GAMC directamente desde el navegador.

**Motivo:** la `key` quedaría expuesta; además se necesita lista blanca y control de uso.

**Consecuencia:** el backend es obligatorio incluso para una demo que solo muestra capas.

### AD-02 — Datos procesados en archivos para el MVP

**Decisión:** servir indicadores desde JSON/CSV generados por el pipeline.

**Motivo:** elimina dependencia de base de datos y acelera la entrega; el volumen (15 distritos × 11 años) es pequeño.

**Consecuencia:** actualizar datos requiere reejecutar el pipeline y redesplegar, aceptable para hackathon.

### AD-03 — ICVSA histórico con componente territorial fijo

**Decisión:** publicar una serie histórica de ICVSA 2015–2025 donde NDVI y LST varían por año y equipamiento/movilidad se fijan en `t_ref`, declarado en la interfaz y en la API.

**Motivo:** el reto exige una puntuación socioambiental **histórica**; el GAMC no garantiza series anuales de equipamiento, pero sí un estado de referencia verificable.

**Consecuencia:** la serie es comparable entre años y honesta sobre su composición. Se publica `index_without_territorial` para separar el efecto ambiental del territorial y se evita interpolar datos municipales.

### AD-04 — Vectores primero, WMS para visualización

**Decisión:** usar las capas **vectoriales** del GAMC (distritos, parques, escuelas, salud, transporte) como fuente primaria para conteos, áreas y accesibilidad; el WMS queda para visualización y consulta puntual.

**Motivo:** `GetMap` devuelve imágenes y `GetFeatureInfo` consulta un punto; los cálculos requieren geometrías o tablas.

**Consecuencia:** si el GAMC no entrega un vector, el indicador correspondiente se marca `insufficient_data` y no se estima por píxeles del WMS.

### AD-05 — Sin IA generativa

**Decisión:** hotspots mediante pendientes, umbrales y reglas estadísticas.

**Motivo:** transparencia, reproducibilidad y menor riesgo en 48 horas.

### AD-06 — Leaflet en lugar de mapas 3D

**Decisión:** mapa 2D con Leaflet.

**Motivo:** soporte nativo de WMS, menor complejidad y buen rendimiento.

### AD-07 — Mapas de calor precalculados

**Decisión:** generar los mapas de calor de LST y severidad en el pipeline y servirlos como raster, tiles o puntos agregados.

**Motivo:** evita recalcular estadísticas en el navegador y mantiene tiempos de carga bajos.

**Consecuencia:** actualizar el año visible requiere que el pipeline haya generado ese año.

### AD-08 — Correlación como análisis exploratorio

**Decisión:** ofrecer dispersión y coeficientes entre tendencia ambiental y acceso, sin modelos causales.

**Motivo:** el reto pide explorar la relación; 15 distritos no permiten inferencia causal robusta.

**Consecuencia:** la UI muestra `n`, el coeficiente y una advertencia explícita.

---

## 7. Seguridad

| Control | Implementación |
|---|---|
| Secreto de GAMC | `GAMC_API_KEY` en `.env`, nunca en repo ni bundle. |
| Lista blanca | `service_id` permitidos en configuración del backend. |
| Validación | Esquema estricto de parámetros WMS; rechazar valores fuera de rango. |
| Operaciones | Permitir solo `GetMap`, `GetLegendGraphic`, `GetFeatureInfo`. |
| Caché | Cachear tiles/consultas para reducir llamadas al servicio municipal. |
| Límites | Rate limit por IP y tamaño máximo de respuesta. |
| CORS | Restringido al dominio del frontend. |
| Logs | Sin registrar la `key` ni parámetros sensibles. |
| Rotación | Solicitar credencial específica de despliegue; rotar si se filtró. |

**.env.example**

```dotenv
PORT=3000
NODE_ENV=development
GAMC_WMS_URL=https://serviciosgamc.cochabamba.bo/api/gs/wms
GAMC_API_KEY=
GAMC_ALLOWED_SERVICE_IDS=
CORS_ORIGIN=http://localhost:5173
```

---

## 8. Despliegue

### Entornos

| Entorno | Frontend | Backend | Datos |
|---|---|---|---|
| Local | Vite dev server | Express local | Archivos en `data/` |
| Demo | Build estático (Vercel/Netlify) | Servicio Node (Render/Railway/Fly) | Archivos incluidos en el build |
| Futuro | CDN | Contenedor | PostgreSQL + PostGIS |

### Consideraciones

- El frontend usa `VITE_API_BASE_URL` para apuntar al backend.
- El backend debe permitir servir `data/processed` como estático o mediante endpoints.
- Healthcheck en `/api/health` para plataformas de despliegue.
- Si el WMS no responde en la demo, las capas municipales se desactivan y se muestra aviso.

---

## 9. Riesgos técnicos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| GeoJSON no corresponde a distritos o es inválido | Bloquea estadísticas por distrito | Validar propiedades, CRS, cantidad de polígonos y topología al inicio |
| WMS solo devuelve mapas, no vectores completos | Limita cálculos de áreas/cobertura | Solicitar capas vectoriales al GAMC; WMS para visualización y `GetFeatureInfo` |
| Clave API expuesta | Acceso no autorizado | Proxy, variables de entorno, rotación y control de uso |
| Cobertura satelital desigual | Comparaciones poco fiables | QA, indicadores de cobertura y advertencias |
| Equipamientos sin serie histórica | El ICVSA no tendría territorio anual | Fijar `t_ref` declarado, publicar sensibilidad y no interpolar |
| Capas vectoriales no entregadas o incompletas | Índice y hotspots de equipamiento incompletos | Marcar `insufficient_data`, usar lo verificable y documentar la brecha |
| Correlación interpretada como causalidad | Conclusiones erróneas | Presentar como exploratoria, con `n` y advertencia visible |
| Población desactualizada | Tasas por habitante engañosas | Indicar año de referencia y supuestos |
| Tiempo limitado | MVP incompleto | Priorizar mapa + series NASA + ICVSA + comparador |
| Licencias municipales | Publicación no autorizada | Confirmar términos y publicar solo lo permitido |

---

## 10. Escalabilidad futura

1. Migrar indicadores a PostgreSQL + PostGIS con índices espaciales.
2. Servir tiles vectoriales (MVT) para coropletas y capas.
3. Automatizar el pipeline NASA con un job programado.
4. Incorporar más variables (calidad del aire, agua, cobertura vegetal fina).
5. Añadir series municipales históricas si el GAMC las publica.
6. Exponer API pública versionada y descarga de datasets.
