# 03 — Arquitectura — GeoQocha

Diseño técnico del MVP de **GeoQocha**. Prioriza la entrega rápida en hackathon, la independencia de los tres frentes, la reproducibilidad del procesamiento satelital y la seguridad de las credenciales del GAMC y del proveedor de IA.

---

## 1. Visión general

```text
                         FUENTES DE DATOS
        ┌───────────────────────┬────────────────────────┐
        │ NASA MODIS            │ GAMC                   │
        │ NDVI / LST            │ WMS / vectores         │
        └───────────┬───────────┴───────────┬────────────┘
                    │                       │
          scripts/ Python/GEE        Proxy WMS server-side
                    │                       │
                    ▼                       ▼
        data/processed/*.json       Capas visuales +
        + metadatos                 atributos puntuales
                    │                       │
                    └───────────┬───────────┘
                                ▼
                    Next.js Route Handlers
             /api/gamc/wms  ·  /api/ai-analyst  ·  /api/districts
                                │
                                ▼
              Next.js App Router + React + TypeScript
             Leaflet · Recharts · Tailwind CSS · RAG ligero
                                │
                                ▼
        Mapa full-screen, panel distrital, concientización,
             chat IA y diagnóstico automático
```

### Principios de diseño

1. **Credenciales fuera del cliente.** La `key` del GAMC y la clave del proveedor de IA viven solo en el servidor.
2. **Contrato primero y mock primero.** Tipos y datos simulados se congelan antes de abrir las ramas.
3. **Independencia por carpeta.** Mapas, datos/IA y analítica no se importan entre sí durante el desarrollo.
4. **Datos procesados como contrato.** El frontend consume un esquema estable, no formatos crudos de NASA ni WMS.
5. **Degradación elegante.** Si el WMS o el proveedor de IA fallan, el mapa base, los indicadores y el fallback por reglas siguen funcionando.
6. **Reproducibilidad.** El procesamiento satelital es un pipeline documentado y reejecutable.
7. **Trazabilidad.** Cada cifra enlaza a dataset, año, transformación y fuente.
8. **IA que explica, no que inventa.** La IA redacta y contextualiza hechos precalculados; no calcula el índice ni hotspots.
9. **Simplicidad primero.** Archivos JSON/GeoJSON antes que base de datos para el MVP.

---

## 2. Componentes

### 2.1 Frontend

| Aspecto | Definición |
|---|---|
| Tecnología | Next.js (App Router) + React + TypeScript |
| Estilos | Tailwind CSS |
| Mapas | Leaflet + React Leaflet |
| Gráficos | Recharts |
| Estado | URL + estado local; sin estado global complejo |
| Datos | `public/data/mock_distritos.json` en desarrollo; `distritos_data.json` en producción |
| Responsabilidad | Mapa full-screen, capas WMS, movilidad, panel distrital, concientización y chat IA |

**Estructura interna**

```text
src/
├── app/
│   ├── layout.tsx           # shell global, metadatos y tokens
│   ├── page.tsx             # composición full-screen del mapa
│   └── api/
│       ├── gamc/wms/        # proxy WMS (DEV1)
│       └── ai-analyst/      # chat y diagnóstico (DEV2)
├── components/
│   ├── map/                 # DEV1: mapa, capas, leyendas, transporte
│   ├── analytics/           # DEV3: panel, fichas y gráficos
│   ├── awareness/           # DEV3: deforestación y concientización
│   └── ai/                  # DEV3: chat y tarjetas de diagnóstico
├── services/
│   └── wms/                 # DEV1: cliente WMS tipado
├── backend/
│   ├── gamc/                # DEV1: validación y caché del proxy
│   ├── data/                # DEV2: lectura y normalización
│   └── ai/                  # DEV2: RAG, prompts, proveedor, guardrails
├── lib/
│   └── data-source.ts       # selector mock/real (compartido)
└── types/
    └── geoqocha.ts          # contrato compartido congelado
```

### 2.2 Backend

| Aspecto | Definición |
|---|---|
| Tecnología | Next.js Route Handlers (runtime Node.js) + TypeScript |
| Responsabilidad | Proxy WMS, endpoint de IA, lectura de datos, validación y caché |
| Persistencia MVP | Archivos JSON/GeoJSON en `data/processed/` y `public/data/` |
| Persistencia futura | PostgreSQL + PostGIS |
| Autenticación | No existe en el MVP; no se recogen datos personales |

**Estructura interna**

```text
src/backend/
├── gamc/                    # lista blanca, validación WMS, caché
├── data/                    # lectura de distritos_data.json
└── ai/
    ├── retrieval.ts         # recuperación de fragmentos por distrito/año/métrica
    ├── context.ts           # construcción de contexto y citas
    ├── provider.ts          # adaptador Gemini u OpenAI
    ├── guardrails.ts        # validación numérica, citas y antiinyección
    └── prompts.ts           # prompt de sistema versionado
```

**Regla de servidor:** ningún módulo de `src/backend/` se importa desde componentes de cliente. Las claves solo se leen con `process.env` en el servidor.

### 2.3 Procesamiento de datos

```text
scripts/
├── run.py                   # orquestador del pipeline
├── config.py                # rutas, periodo, umbrales y versión
├── nasa/                    # MODIS, QA, escalas y estadística zonal
├── indicators/              # ICVSA, tendencias, hotspots y brechas
└── validate_output.py       # valida el contrato de distritos_data.json
```

| Tarea | Herramienta sugerida |
|---|---|
| Estadística zonal NDVI/LST | Google Earth Engine o Python (rasterio/geopandas) |
| Validación de vectores GAMC | Python (geopandas, shapely) |
| Accesibilidad a equipamiento | Python (sjoin, distancias) o PostGIS |
| Tendencias y aceleración | Python (numpy/scipy, Mann-Kendall opcional) |
| Correlación exploratoria | Python (pandas, scipy.stats) |
| Construcción del ICVSA | Python en el pipeline de datos |
| Mapas de calor | Raster precalculado (PNG/GeoTIFF) o celdas agregadas |

**Salidas del pipeline**

- `data/geojson/districts.geojson`
- `data/geojson/transport.geojson`
- `data/geojson/equipment.geojson`
- `data/processed/distritos_data.json` (contrato principal del MVP)
- `data/processed/district_year.json`
- `data/processed/trends.json`
- `data/processed/equipment_metrics.json`
- `data/processed/hotspots.json`
- `data/processed/correlations.json`
- `data/processed/heatmap_lst.json`
- `data/metadata/sources.json`
- `public/data/distritos_data.json` (copia servida al frontend)

### 2.4 Capa de datos

| Carpeta | Contenido |
|---|---|
| `public/data/` | Datos servidos al frontend: mock y dataset real. |
| `data/geojson/` | Geometrías validadas (distritos, transporte, equipamiento). |
| `data/processed/` | Series distrito-año, tendencias, hotspots, índice. |
| `data/metadata/` | Fuente, fecha, licencia, transformaciones, limitaciones. |

### 2.5 Capa de IA

```text
Pregunta del usuario
        │
        ▼
POST /api/ai-analyst
        │
        ├── valida AIRequest y limita tasa
        ├── recupera fragmentos de distritos_data.json
        ├── arma contexto con cifras, años y source_refs
        ├── si hay proveedor: llama a Gemini/OpenAI con prompt de sistema
        └── si no hay proveedor o falla: genera respuesta por reglas
        │
        ▼
AIResponse con answer, insights, citations, disclaimer y fallback_used
```

| Componente | Responsabilidad |
|---|---|
| Recuperación | Selecciona distrito, año y métricas relevantes; no envía todo el dataset. |
| Contexto | Incluye solo hechos del dataset, con `source_ref` y año. |
| Prompt | Prohíbe inventar cifras, afirmar causalidad o dar recomendaciones vinculantes. |
| Guardrails | Verifica que los números citados existan en el contexto y que haya citas. |
| Fallback | Respuesta por reglas si no hay clave, timeout o error del proveedor. |
| Costo | Límite de tokens, timeout, caché de diagnósticos y rate limit. |

---

## 3. Stack recomendado

| Componente | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js, React, TypeScript | App Router, route handlers y despliegue simple en un solo proyecto |
| Estilos | Tailwind CSS | Diseño full-screen y paneles translúcidos consistentes |
| Mapas | Leaflet, React Leaflet | WMS + GeoJSON + interacción |
| Mapas de calor | Leaflet.heat, capa raster o celdas precalculadas | Islas de calor sin recalcular en el cliente |
| Gráficos | Recharts | Series históricas y comparaciones |
| Backend | Next.js Route Handlers | Proxy WMS y endpoint de IA en el mismo despliegue |
| IA | Gemini u OpenAI + RAG ligero sobre JSON | Explicación en lenguaje natural con contexto acotado |
| Procesamiento satelital | Python y/o Google Earth Engine | Extracción zonal, control de calidad y agregación |
| Datos MVP | JSON/GeoJSON procesados | Simplifica entrega rápida |
| Persistencia futura | PostgreSQL + PostGIS | Consultas y análisis espacial escalables |

---

## 4. Estructura del repositorio

El MVP se construye en una **aplicación Next.js en la raíz**. Las carpetas `frontend/` y `backend/` existentes quedan como legado congelado hasta que la migración esté completa; no se editan durante el hackathon.

```text
geoqocha/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── map/
│   │   ├── analytics/
│   │   ├── awareness/
│   │   └── ai/
│   ├── services/wms/
│   ├── backend/
│   │   ├── gamc/
│   │   ├── data/
│   │   └── ai/
│   ├── lib/
│   └── types/
├── public/
│   └── data/
│       ├── mock_distritos.json
│       └── distritos_data.json
├── scripts/
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

### 5.1 Carga del mapa y del panel

```text
Usuario abre /
        ↓
Next.js renderiza el shell full-screen
        ↓
src/lib/data-source.ts elige mock o real
        ↓
Mapa dibuja los 15 distritos y el panel lee ?district=&year=
        ↓
Leaflet dibuja coropletas, capas WMS y paradas propuestas
        ↓
Recharts dibuja NDVI, LST e ICVSA del distrito
```

### 5.2 Proxy WMS

```text
Frontend → GET /api/gamc/wms?service_id=...&REQUEST=GetMap&...
                  ↓
        route handler valida service_id (lista blanca),
        valida REQUEST, BBOX, WIDTH, HEIGHT, FORMAT
                  ↓
        añade key desde process.env.GAMC_API_KEY
                  ↓
        reenvía a https://serviciosgamc.cochabamba.bo/api/gs/wms
                  ↓
        devuelve PNG/JSON con caché y sin filtrar la clave
```

### 5.3 Consulta de IA

```text
Usuario escribe una pregunta o abre un diagnóstico
        ↓
POST /api/ai-analyst con AIRequest
        ↓
validación + rate limit + recuperación de contexto
        ↓
proveedor de IA o fallback por reglas
        ↓
validación de cifras y citas
        ↓
AIResponse → chat o tarjetas de diagnóstico
```

### 5.4 Procesamiento NASA (offline)

```text
GeoJSON distritos → validar CRS y topología
        ↓
MODIS MOD13Q1 / MOD11A2 (2015–2025)
        ↓
filtro QA + conversión de LST a °C
        ↓
estadística zonal por distrito y año
        ↓
vectores GAMC → población, equipamiento y accesibilidad
        ↓
ICVSA: ambiente anual + territorio fijo en t_ref
        ↓
tendencias, brechas y hotspots
        ↓
distritos_data.json + metadatos → public/data/
```

---

## 6. Decisiones de arquitectura

### AD-01 — Proxy backend para GAMC

**Decisión:** no consumir el WMS del GAMC directamente desde el navegador.

**Motivo:** la `key` quedaría expuesta; además se necesita lista blanca y control de uso.

**Consecuencia:** el servidor Next.js es obligatorio incluso para una demo que solo muestra capas.

### AD-02 — Datos procesados en archivos para el MVP

**Decisión:** servir indicadores desde JSON/GeoJSON generados por el pipeline.

**Motivo:** elimina dependencia de base de datos y acelera la entrega; el volumen (15 distritos × 11 años) es pequeño.

**Consecuencia:** actualizar datos requiere reejecutar el pipeline y redesplegar, aceptable para hackathon.

### AD-03 — ICVSA histórico con componente territorial fijo

**Decisión:** publicar una serie histórica de ICVSA 2015–2025 donde NDVI y LST varían por año y equipamiento/movilidad se fijan en `t_ref`, declarado en la interfaz y en la API.

**Motivo:** el reto exige una puntuación socioambiental histórica; el GAMC no garantiza series anuales de equipamiento, pero sí un estado de referencia verificable.

**Consecuencia:** la serie es comparable entre años y honesta sobre su composición. Se publica `index_without_territorial` para separar el efecto ambiental del territorial y se evita interpolar datos municipales.

### AD-04 — Vectores primero, WMS para visualización

**Decisión:** usar las capas vectoriales del GAMC (distritos, parques, escuelas, salud, transporte) como fuente primaria para conteos, áreas y accesibilidad; el WMS queda para visualización y consulta puntual.

**Motivo:** `GetMap` devuelve imágenes y `GetFeatureInfo` consulta un punto; los cálculos requieren geometrías o tablas.

**Consecuencia:** si el GAMC no entrega un vector, el indicador correspondiente se marca `insufficient_data` y no se estima por píxeles del WMS.

### AD-05 — IA generativa acotada y trazable

**Estado:** reemplaza la decisión anterior «Sin IA generativa».

**Decisión:** usar un modelo generativo únicamente para redactar explicaciones, responder preguntas y ordenar hallazgos a partir de hechos precalculados. El modelo no calcula el ICVSA, no detecta hotspots, no imputa datos y no decide prioridades.

**Motivo:** el producto necesita un copiloto comprensible para ciudadanía y funcionarios, pero la validez metodológica no puede depender de una caja negra.

**Consecuencia:** toda respuesta incluye citas, advertencia de no causalidad, `fallback_used` y validación de que las cifras existen en el contexto. Si no hay proveedor, se usa una respuesta por reglas.

### AD-06 — Leaflet en lugar de mapas 3D

**Decisión:** mapa 2D con Leaflet.

**Motivo:** soporte nativo de WMS, menor complejidad y buen rendimiento.

### AD-07 — Mapas de calor precalculados

**Decisión:** generar los mapas de calor de LST y severidad en el pipeline y servirlos como raster, tiles o celdas agregadas.

**Motivo:** evita recalcular estadísticas en el navegador y mantiene tiempos de carga bajos.

**Consecuencia:** actualizar el año visible requiere que el pipeline haya generado ese año.

### AD-08 — Correlación como análisis exploratorio

**Decisión:** ofrecer dispersión y coeficientes entre tendencia ambiental y acceso, sin modelos causales.

**Motivo:** el reto pide explorar la relación; 15 distritos no permiten inferencia causal robusta.

**Consecuencia:** la UI muestra `n`, el coeficiente y una advertencia explícita.

### AD-09 — Una sola aplicación Next.js

**Decisión:** unificar frontend y API en una app Next.js con route handlers, en lugar de Vite + Express separados.

**Motivo:** simplifica despliegue, comparte tipos, evita CORS entre proyectos y permite que los tres frentes trabajen en un solo repositorio con carpetas independientes.

**Consecuencia:** las carpetas `frontend/` y `backend/` actuales quedan como legado congelado. El nuevo código vive en la raíz.

### AD-10 — Contrato y mock congelados antes de las ramas

**Decisión:** crear `src/types/geoqocha.ts` y `public/data/mock_distritos.json` en el Día 0, etiquetarlos y no modificarlos durante el desarrollo.

**Motivo:** garantiza que los tres frentes avancen sin bloqueos ni conflictos.

**Consecuencia:** cualquier cambio de contrato exige un PR `contract/*` con aprobación de los tres.

### AD-11 — Paradas propuestas, no paradas oficiales

**Decisión:** las «paradas seguras» se generan como puntos propuestos a partir de geometrías de transporte y reglas documentadas; se marcan como `data_status: "illustrative"` hasta que el GAMC valide una fuente oficial.

**Motivo:** no existe una fuente municipal verificada de seguridad de paradas; inventar una calificación de seguridad violaría la regla de no inventar datos.

**Consecuencia:** la UI puede mostrar `boarding_recommended`, pero no afirmar que un punto es «seguro» sin evidencia. La palabra «segura» se reemplaza por «parada propuesta» cuando corresponda.

---

## 7. Seguridad

| Control | Implementación |
|---|---|
| Secreto de GAMC | `GAMC_API_KEY` en `.env`, nunca en repo ni bundle. |
| Secreto de IA | `AI_API_KEY` solo en el servidor; nunca con prefijo `NEXT_PUBLIC_`. |
| Lista blanca | `service_id` permitidos en configuración del servidor. |
| Validación WMS | Esquema estricto de parámetros; rechazar valores fuera de rango. |
| Operaciones | Permitir solo `GetMap`, `GetLegendGraphic` y `GetFeatureInfo`. |
| Caché | Cachear tiles/consultas y diagnósticos para reducir llamadas. |
| Límites | Rate limit por IP, timeout y tamaño máximo de respuesta. |
| CORS | Mismo origen en Next.js; no se abre a dominios innecesarios. |
| Logs | Sin registrar claves, prompts con datos sensibles ni parámetros secretos. |
| IA | Contexto acotado, citas obligatorias, validación numérica y antiinyección. |
| Privacidad | Sin cuentas, sin datos personales y sin entrenamiento con consultas de usuarios. |

**`.env.example`**

```dotenv
GAMC_WMS_URL=https://serviciosgamc.cochabamba.bo/api/gs/wms
GAMC_API_KEY=
GAMC_ALLOWED_SERVICE_IDS=

AI_PROVIDER=gemini
AI_API_KEY=
AI_MODEL=
AI_TIMEOUT_MS=20000
AI_MAX_OUTPUT_TOKENS=800

NEXT_PUBLIC_DATA_MODE=mock
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 8. Despliegue

### Entornos

| Entorno | Aplicación | Datos | IA |
|---|---|---|---|
| Local | `next dev` | Mock por defecto | Fallback por reglas si no hay clave |
| Demo | Vercel o Node | `distritos_data.json` si está validado; si no, mock etiquetado | Gemini/OpenAI con fallback |
| Futuro | CDN + contenedor | PostgreSQL + PostGIS | RAG con índice persistente |

### Consideraciones

- Las variables de GAMC y de IA se configuran en el panel del proveedor de despliegue, nunca en el repositorio.
- `/api/ai-analyst` y `/api/gamc/wms` usan runtime Node.js.
- Healthcheck: `/api/health`.
- Si el WMS no responde en la demo, las capas municipales se desactivan y se muestra aviso.
- Si la IA no responde, el chat y el diagnóstico usan el fallback por reglas.
- El modo de datos (`mock` o `real`) se declara en la interfaz.

---

## 9. Riesgos técnicos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| GeoJSON no corresponde a distritos o es inválido | Bloquea estadísticas por distrito | Validar propiedades, CRS, cantidad de polígonos y topología al inicio |
| WMS solo devuelve mapas, no vectores completos | Limita cálculos de áreas/cobertura | Solicitar capas vectoriales; WMS para visualización y `GetFeatureInfo` |
| Clave API expuesta | Acceso no autorizado | Proxy, variables de entorno, rotación y control de uso |
| Clave de IA expuesta | Costo y abuso | Solo servidor; nunca `NEXT_PUBLIC_`; rate limit y límite de tokens |
| Alucinación del modelo | Cifras o conclusiones falsas | Contexto cerrado, citas, validación numérica y advertencia |
| Proveedor de IA caído o caro | Chat no disponible | Timeout, caché, fallback por reglas y límite de uso |
| Cobertura satelital desigual | Comparaciones poco fiables | QA, indicadores de cobertura y advertencias |
| Equipamientos sin serie histórica | El ICVSA no tendría territorio anual | Fijar `t_ref` declarado, publicar sensibilidad y no interpolar |
| Capas vectoriales incompletas | Índice y hotspots parciales | Marcar `insufficient_data`, usar lo verificable y documentar la brecha |
| Paradas sin fuente oficial | Afirmación de seguridad no respaldada | Presentarlas como propuestas ilustrativas y no afirmar seguridad |
| Correlación interpretada como causalidad | Conclusiones erróneas | Presentarla como exploratoria, con `n` y advertencia visible |
| Población desactualizada | Tasas por habitante engañosas | Indicar año de referencia y supuestos |
| Tiempo limitado | MVP incompleto | Priorizar mapa + series NASA + panel + IA con fallback |
| Licencias municipales | Publicación no autorizada | Confirmar términos y publicar solo lo permitido |

---

## 10. Escalabilidad futura

1. Migrar indicadores a PostgreSQL + PostGIS con índices espaciales.
2. Servir tiles vectoriales (MVT) para coropletas y capas.
3. Automatizar el pipeline NASA con un job programado.
4. Persistir el índice RAG y evaluar recuperación híbrida.
5. Incorporar más variables (calidad del aire, agua, cobertura vegetal fina).
6. Añadir series municipales históricas si el GAMC las publica.
7. Exponer API pública versionada y descarga de datasets.
