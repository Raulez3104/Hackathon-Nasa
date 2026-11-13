# 06 — Plan de desarrollo — GeoQocha

Plan de ejecución del MVP de **GeoQocha** para un hackathon de **48 horas con 3 desarrolladores de sistemas**. El plan está diseñado para que cada persona avance en paralelo, en su propia carpeta y rama, sin esperar el trabajo de las otras dos.

> **Regla de oro:** el contrato compartido y el mock se congelan antes de abrir las ramas. A partir de ese momento, ningún desarrollador depende del código de otro para avanzar. La integración es una fase explícita al final, no parte del camino crítico.

---

## 1. Principios del plan

| Principio | Aplicación concreta |
|---|---|
| Contrato primero | Tipos y mock se acuerdan en el día 0 y se versionan como `contract-v0.1.0`. |
| Mock primero | Los tres frentes consumen el mismo JSON simulado desde la primera hora. |
| Independencia por carpeta | Cada desarrollador es dueño exclusivo de sus carpetas y archivos. |
| Independencia por rama | `feat/dev1-*`, `feat/dev2-*` y `feat/dev3-*` no se importan entre sí. |
| Equidad de complejidad | Cada frente tiene 6 tareas de peso equivalente (6 h nominales) y la misma mezcla de retos. |
| Integración tardía | La composición visual y el cambio de mock a datos reales ocurren en las últimas 6 h. |
| Honestidad de datos | Todo dato simulado se marca como ilustrativo; `null` significa «no disponible». |
| IA acotada | La IA redacta y explica hechos precalculados; no calcula el índice, hotspots ni cifras. |
| Seguridad | Claves del GAMC y del proveedor de IA solo en el servidor y en `.env`. |

---

## 2. Supuestos y capacidad

| Supuesto | Valor |
|---|---|
| Duración | 48 horas continuas con turnos rotativos |
| Equipo | 3 desarrolladores de sistemas |
| Capacidad total | ~144 horas-persona |
| Día 0 compartido | 6 h por persona (18 h) |
| Trabajo autónomo | 6 tareas × 6 h = 36 h por persona |
| Integración y demo | 6 h por persona (18 h) |
| Stack | Next.js + TypeScript + Tailwind + Leaflet + Recharts |
| Datos | Mock compartido; pipeline NASA y GAMC reemplaza el mock al final |
| IA | RAG ligero con Gemini u OpenAI; la IA solo narra hechos del dataset |
| Alcance | MVP de la sección 6; toda función nueva exige quitar otra del mismo frente |

> Las 6 h por tarea son **pesos de planificación**, no cronómetros. Si una tarea crece, se intercambia por otra del mismo frente y peso; no se toma capacidad de otro desarrollador.

---

## 3. Día 0 — Contrato base compartido (T-00)

**Duración:** 6 h. **Participan:** DEV1, DEV2 y DEV3. **Rama:** `chore/contract-v0.1.0`. **Destino:** `dev`.

Antes de abrir las ramas de trabajo se crean y congelan estos archivos:

| Archivo | Contenido | Dueño del cambio |
|---|---|---|
| `src/types/geoqocha.ts` | Tipos compartidos del contrato | Los tres, por consenso |
| `src/lib/data-source.ts` | Selector mock/real por variable de entorno | Los tres, por consenso |
| `public/data/mock_distritos.json` | 15 distritos simulados con series y paradas | Los tres, por consenso |
| `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs` | Andamiaje técnico con `next`, `react`, `leaflet`, `react-leaflet`, `recharts`, `tailwindcss`, `typescript` y tipos | Los tres, por consenso |
| `src/app/layout.tsx`, `src/app/globals.css` | Shell global y tokens visuales | Los tres, por consenso |
| `.env.example` | Variables del GAMC y de IA sin valores reales | Los tres, por consenso |

### 3.1 Reglas del contrato congelado

1. `CONTRACT_VERSION` se declara en `src/types/geoqocha.ts` con el valor `"0.1.0"`.
2. Después del tag `contract-v0.1.0`, los archivos compartidos son **solo lectura**.
3. Un cambio de contrato exige una rama `contract/*`, un PR separado y aprobación de los tres desarrolladores.
4. Nadie modifica el mock o los tipos para «desbloquearse»; si falta un campo, se abre un PR de contrato.
5. El mock lleva `data_status: "illustrative"` a nivel de archivo y de distrito.
6. Los tipos usan campos en inglés y unidades en el nombre, según `04-CONTRATOS-API.md`.

### 3.2 Interfaces exactas de `src/types/geoqocha.ts`

```ts
export const CONTRACT_VERSION = "0.1.0" as const;

export type DataStatus = "real" | "illustrative" | "insufficient";
export type DataQualityFlag = "ok" | "partial" | "insufficient";
export type TrendDirection = "improving" | "stable" | "worsening" | "undetermined";
export type RiskLevel = "low" | "medium" | "high" | "insufficient_data";
export type Variable =
  | "icvsa"
  | "environmental_index"
  | "ndvi"
  | "lst"
  | "priority"
  | "equipment"
  | "mobility";

export interface DistrictSeriesPoint {
  year: number;
  ndvi_mean: number | null;
  lst_mean_celsius: number | null;
  environmental_index: number | null;
  socioenvironmental_index: number | null;
  index_without_territorial: number | null;
  data_quality_flag: DataQualityFlag;
}

export interface DistrictTrend {
  variable: "ndvi" | "lst" | "environmental_index" | "socioenvironmental_index";
  direction: TrendDirection;
  slope_per_year: number | null;
  unit: string;
  years_used: number[];
  method: string;
  is_significant: boolean | null;
  acceleration: number | null;
  accelerated: boolean;
  notes: string[];
}

export interface EquipmentMetrics {
  district_id: number;
  territorial_reference_year: number | null;
  population: number | null;
  green_area_m2_per_capita: number | null;
  schools_per_1000: number | null;
  health_centers_per_1000: number | null;
  transport_coverage_fraction: number | null;
  equipment_access_index: number | null;
  mobility_access_index: number | null;
  deficit_flags: string[];
}

export interface StopPoint {
  stop_id: string;
  name: string;
  district_id: number;
  latitude: number;
  longitude: number;
  routes: string[];
  boarding_recommended: boolean;
  safety_score: number | null;
  notes: string | null;
  data_status: DataStatus;
}

export interface DistrictGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

export interface DistrictData {
  district_id: number;
  name: string;
  geometry: DistrictGeometry | null;
  area_km2: number | null;
  population: number | null;
  population_year: number | null;
  territorial_reference_year: number | null;
  latest_year: number | null;
  latest_socioenvironmental_index: number | null;
  risk_level: RiskLevel;
  series: DistrictSeriesPoint[];
  trends: DistrictTrend[];
  equipment: EquipmentMetrics;
  transport_stops: StopPoint[];
  data_status: DataStatus;
  source_refs: string[];
}

export interface AIRequest {
  mode: "chat" | "diagnosis";
  district_id?: number;
  year?: number;
  question?: string;
  locale?: "es";
}

export interface AIEvidence {
  field: string;
  year: number | null;
  value: number | string | null;
  unit: string | null;
  source_ref: string;
}

export interface AIInsight {
  id: string;
  kind: "observation" | "risk" | "recommendation" | "caveat";
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  evidence: AIEvidence[];
}

export interface AICitation {
  source_ref: string;
  label: string;
  field?: string;
  year?: number;
}

export interface AIResponse {
  request_id: string;
  mode: "chat" | "diagnosis";
  district_id: number | null;
  year: number | null;
  answer: string;
  insights: AIInsight[];
  citations: AICitation[];
  disclaimer: string;
  data_status: DataStatus;
  model: {
    provider: string;
    name: string;
    prompt_version: string;
  } | null;
  generated_at: string;
  fallback_used: boolean;
}
```

### 3.3 Estructura de `public/data/mock_distritos.json`

```json
{
  "contract_version": "0.1.0",
  "data_status": "illustrative",
  "generated_at": "2026-11-13T00:00:00Z",
  "districts": [
    {
      "district_id": 1,
      "name": "Distrito 1",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-66.18, -17.40],
          [-66.16, -17.40],
          [-66.16, -17.38],
          [-66.18, -17.38],
          [-66.18, -17.40]
        ]]
      },
      "area_km2": 12.4,
      "population": 48210,
      "population_year": 2024,
      "territorial_reference_year": 2024,
      "latest_year": 2025,
      "latest_socioenvironmental_index": 64,
      "risk_level": "medium",
      "series": [
        {
          "year": 2025,
          "ndvi_mean": 0.42,
          "lst_mean_celsius": 29.5,
          "environmental_index": 67,
          "socioenvironmental_index": 64,
          "index_without_territorial": 67,
          "data_quality_flag": "ok"
        }
      ],
      "trends": [
        {
          "variable": "ndvi",
          "direction": "worsening",
          "slope_per_year": -0.0012,
          "unit": "NDVI/año",
          "years_used": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
          "method": "OLS sobre medias anuales",
          "is_significant": false,
          "acceleration": null,
          "accelerated": false,
          "notes": ["Ejemplo ilustrativo."]
        }
      ],
      "equipment": {
        "district_id": 1,
        "territorial_reference_year": 2024,
        "population": 48210,
        "green_area_m2_per_capita": 3.8,
        "schools_per_1000": 1.2,
        "health_centers_per_1000": 0.4,
        "transport_coverage_fraction": 0.71,
        "equipment_access_index": 58,
        "mobility_access_index": 61,
        "deficit_flags": ["GREEN_AREA_LOW"]
      },
      "transport_stops": [
        {
          "stop_id": "stop-001",
          "name": "Esquina de ejemplo",
          "district_id": 1,
          "latitude": -17.39,
          "longitude": -66.17,
          "routes": ["R1", "R2"],
          "boarding_recommended": true,
          "safety_score": null,
          "notes": "Punto ilustrativo; no es una parada oficial.",
          "data_status": "illustrative"
        }
      ],
      "data_status": "illustrative",
      "source_refs": ["mock"]
    }
  ]
}
```

> El ejemplo anterior muestra un solo distrito y un solo punto de serie por brevedad. El archivo real contiene los 15 distritos y las 11 observaciones anuales.

**Reglas del mock:**

- Exactamente **15 distritos** con `district_id` de 1 a 15.
- Cada distrito incluye `geometry` Polygon simplificada y cerrada, suficiente para el mapa del mock.
- Serie completa **2015–2025** por distrito, con `null` donde el dato no exista.
- Al menos una tendencia de NDVI y una de ICVSA por distrito, con `years_used` explícito.
- Puntajes de 1 a 100; población y equipamiento plausibles pero ficticios.
- Entre 3 y 6 `transport_stops` por distrito, con `data_status: "illustrative"`.
- `safety_score` puede ser `null`; no se inventa una calificación oficial de seguridad.
- El archivo se sirve desde `/data/mock_distritos.json`.
- `src/lib/data-source.ts` devuelve el mock por defecto y el archivo real cuando `NEXT_PUBLIC_DATA_MODE=real`.

### 3.4 Criterio de salida del Día 0

- [ ] `npm run typecheck` pasa con los tipos compartidos.
- [ ] El JSON tiene 15 distritos y 11 puntos por serie.
- [ ] Los tres desarrolladores pueden importar los tipos y leer el mock.
- [ ] El tag `contract-v0.1.0` existe en `dev`.
- [ ] Las tres ramas de trabajo se crean desde ese tag.
- [ ] Nadie necesita esperar a otra persona para empezar.

---

## 4. Estructura y propiedad de carpetas

| Ruta | Dueño | Uso | Regla |
|---|---|---|---|
| `src/types/geoqocha.ts` | Compartido | Contrato de tipos | Solo lectura tras el Día 0 |
| `src/lib/data-source.ts` | Compartido | Selector mock/real | Solo lectura tras el Día 0 |
| `public/data/mock_distritos.json` | Compartido | Datos simulados | Solo lectura tras el Día 0 |
| `src/app/layout.tsx`, `src/app/globals.css` | Compartido | Shell y tokens | Solo lectura tras el Día 0 |
| `src/components/map/` | DEV1 | Mapa, capas, leyendas y movilidad | Exclusivo |
| `src/services/wms/` | DEV1 | Cliente y configuración WMS | Exclusivo |
| `src/app/api/gamc/` | DEV1 | Proxy WMS server-side | Exclusivo |
| `src/backend/gamc/` | DEV1 | Validación y caché del proxy | Exclusivo |
| `src/app/page.tsx` | DEV1 | Composición del shell full-screen | Exclusivo, sin importar componentes de DEV3 |
| `scripts/` | DEV2 | Pipeline Python NASA/GAMC | Exclusivo |
| `data/` | DEV2 | Datos procesados y metadatos | Exclusivo |
| `src/backend/data/` | DEV2 | Lectura y normalización del dataset | Exclusivo |
| `src/backend/ai/` | DEV2 | RAG, prompts, proveedor y guardrails | Exclusivo |
| `src/app/api/ai-analyst/` | DEV2 | Endpoint de chat y diagnóstico | Exclusivo |
| `src/app/api/districts/`, `src/app/api/comparison/`, `src/app/api/hotspots/`, `src/app/api/heatmap/`, `src/app/api/analysis/`, `src/app/api/methodology/`, `src/app/api/sources/`, `src/app/api/health/` | DEV2 | Route handlers de datos procesados y estado del servicio | Exclusivo |
| `src/components/analytics/` | DEV3 | Panel, fichas y gráficos | Exclusivo |
| `src/components/awareness/` | DEV3 | Deforestación y concientización | Exclusivo |
| `src/components/ai/` | DEV3 | Chat UI y tarjetas de diagnóstico | Exclusivo |
| `public/data/distritos_data.json` | DEV2 | Dataset real de producción | Generado por el pipeline |
| `package.json`, lockfile | Compartido | Dependencias | Solo PR `chore/deps/*` |

> **Ajuste de independencia:** la configuración inicial de Next.js, Tailwind y TypeScript se ejecuta en el Día 0 compartido, no como tarea exclusiva de DEV1. Así DEV2 y DEV3 no esperan a que DEV1 termine el andamiaje. DEV1 conserva el diseño full-screen, el mapa y la composición visual. Además, DEV1 recibe `src/app/api/gamc/` y `src/backend/gamc/` para implementar el proxy WMS sin depender de DEV2; DEV2 conserva `src/backend/data/` y `src/backend/ai/`.

**Reglas de propiedad:**

1. Nadie edita archivos de otra persona sin un PR acordado.
2. No se mueven carpetas ni se renombran archivos compartidos.
3. Los estilos globales solo se tocan en T-00; cada frente usa tokens y clases Tailwind.
4. Las dependencias nuevas se agregan en un PR `chore/deps/*` y luego se hace rebase.
5. Los imports entre `src/components/map`, `src/components/analytics` y `src/components/ai` están prohibidos durante el desarrollo; la composición se hace en la integración.

---

## 4.1 Matriz de seguimiento de tareas

Esta matriz es la fuente operativa para conocer el avance del desarrollo. El estado inicial de todas las tareas es `pendiente`.

| ID | Responsable | Entregable resumido | Estado | Evidencia / actualización | Lista para integrar |
|---|---|---|---|---|---|
| T-00 | DEV1 + DEV2 + DEV3 | Contrato, mock y andamiaje | `pendiente` | — | No |
| T1-01 | DEV1 | Shell, mapa, semáforo y mapa de calor LST | `pendiente` | — | No |
| T1-02 | DEV1 | Proxy WMS seguro | `pendiente` | — | No |
| T1-03 | DEV1 | Capas WMS, leyendas y degradación | `pendiente` | — | No |
| T1-04 | DEV1 | Rutas y paradas propuestas | `pendiente` | — | No |
| T1-05 | DEV1 | URL, comparación y eventos | `pendiente` | — | No |
| T1-06 | DEV1 | Calidad, pruebas y documentación del mapa | `pendiente` | — | No |
| T2-01 | DEV2 | Esqueleto y validación del pipeline | `pendiente` | — | No |
| T2-02 | DEV2 | Procesamiento NASA NDVI/LST | `pendiente` | — | No |
| T2-03 | DEV2 | Índice, brechas, correlaciones, hotspots y APIs de datos | `pendiente` | — | No |
| T2-04 | DEV2 | RAG ligero y contexto con citas | `pendiente` | — | No |
| T2-05 | DEV2 | Endpoint de IA | `pendiente` | — | No |
| T2-06 | DEV2 | Guardrails, pruebas y documentación de IA | `pendiente` | — | No |
| T3-01 | DEV3 | Panel distrital y comparador | `pendiente` | — | No |
| T3-02 | DEV3 | Fichas, brechas y series históricas | `pendiente` | — | No |
| T3-03 | DEV3 | Deforestación y concientización | `pendiente` | — | No |
| T3-04 | DEV3 | Chat IA | `pendiente` | — | No |
| T3-05 | DEV3 | Diagnóstico automático | `pendiente` | — | No |
| T3-06 | DEV3 | Hotspots, metodología, fuentes y calidad de UI | `pendiente` | — | No |
| INT-01 | DEV1 + DEV2 + DEV3 | Integración, QA, despliegue y demo | `pendiente` | — | No aplica |

### Estados permitidos

| Estado | Significado |
|---|---|
| `pendiente` | La tarea aún no comenzó. |
| `en progreso` | Hay trabajo iniciado, pero no cumple todavía el criterio de aceptación. |
| `bloqueada` | No puede avanzar por una dependencia o decisión documentada. |
| `completada` | Cumple el criterio de aceptación y tiene pruebas/documentación correspondientes. |
| `lista para integrar` | Está completada, revisada y puede conectarse con los otros frentes. |
| `integrada` | Está conectada en la aplicación conjunta y pasó la verificación de integración. |

### Regla de actualización

1. Cada desarrollador actualiza la fila de su tarea junto con el commit o PR de esa tarea.
2. `completada` exige cumplir la definición de terminado de la sección 10.
3. `lista para integrar` requiere revisión cruzada y pruebas verdes en la rama del frente.
4. La fila `INT-01` solo pasa a `en progreso` cuando DEV1, DEV2 y DEV3 están `lista para integrar`.
5. La matriz se actualiza mediante PR; no se hacen ediciones simultáneas directas en `dev`.
6. `MEMORY.md` se actualiza solo si el avance cambia una decisión, contrato, alcance, riesgo o hito general.

### Criterio para iniciar la integración

La integración puede comenzar únicamente cuando las 18 tareas de `T1-*`, `T2-*` y `T3-*` estén en estado `lista para integrar`. En ese punto, la matriz debe mostrar:

```text
DEV1: listo para integrar
DEV2: listo para integrar
DEV3: listo para integrar
INT-01: pendiente
```

Después de validar la aplicación completa, `INT-01` pasa a `integrada` y la matriz debe registrar las pruebas, el despliegue y el estado de la demo.

---

## 5. Equipos, ramas y reglas de GitHub

| Desarrollador | Frente | Rama | PR destino |
|---|---|---|---|
| DEV1 | Mapas, WMS y movilidad urbana | `feat/dev1-map-transport` | `dev` |
| DEV2 | Datos NASA, pipeline y backend de IA | `feat/dev2-data-ai` | `dev` |
| DEV3 | Analítica, concientización y chat UI | `feat/dev3-analytics-chat` | `dev` |
| Compartido | Contrato y andamiaje | `chore/contract-v0.1.0` | `dev` |

### 5.1 Flujo de ramas

```text
main
  └── dev
        ├── chore/contract-v0.1.0   (Día 0, se mergea y se etiqueta)
        ├── feat/dev1-map-transport
        ├── feat/dev2-data-ai
        └── feat/dev3-analytics-chat
```

1. El Día 0 se mergea `chore/contract-v0.1.0` a `dev` y se crea el tag `contract-v0.1.0`.
2. Cada desarrollador crea su rama desde `dev` después del tag.
3. Cada tarea se entrega en un PR pequeño, con CI verde.
4. Antes del PR: `git fetch origin && git rebase origin/dev`.
5. El merge a `dev` se hace con squash merge.
6. Al final, `dev` pasa a `main` con un PR de release y el tag `v0.1.0-mvp`.

### 5.2 Reglas para evitar conflictos

| Regla | Motivo |
|---|---|
| Una carpeta, un dueño | Evita ediciones simultáneas del mismo archivo. |
| Archivos compartidos congelados | Elimina conflictos en tipos, mock, layout y configuración. |
| Dependencias solo por PR `chore/deps/*` | Evita conflictos en `package.json` y lockfile. |
| PR pequeños por tarea | Reduce el tamaño del conflicto y facilita la revisión. |
| Rebase antes de cada PR | Mantiene lineal la historia de la rama. |
| Prohibido mover o renombrar archivos ajenos | Evita conflictos de ruta. |
| Conflictos en archivo compartido: detenerse | Se resuelven en un PR de contrato, no dentro de una rama de feature. |

### 5.3 Protecciones y revisión

- `main` y `dev` protegidas: sin pushes directos ni force-push.
- CI obligatorio: `lint`, `typecheck`, `test`, `validate:mock`.
- Un PR requiere al menos **una aprobación de otro desarrollador** y CI verde.
- Un cambio de contrato requiere **las tres aprobaciones**.
- Un cambio de dependencias requiere **las tres aprobaciones**.
- El PR debe declarar: alcance, carpetas tocadas, impacto en contrato, estado de datos y pruebas ejecutadas.

---

## 6. Backlog equilibrado e independiente

Cada frente tiene **6 tareas de 6 h nominales** con la misma mezcla: una base, dos tareas núcleo, una integración interna, una de calidad y una de pruebas/documentación. Las tareas de un frente pueden depender de otras tareas del mismo frente, pero **nunca de otro frente**.

### 6.1 DEV1 — Mapas, WMS y movilidad urbana

| ID | Tarea | Complejidad | Horas | Entregable | Criterio de aceptación |
|---|---|---|---:|---|---|
| T1-01 | Shell full-screen, mapa base, coropletas, semáforo y mapa de calor LST desde el mock | Alta | 6 | `src/app/page.tsx` y `src/components/map/MapShell.tsx` | El mapa ocupa la pantalla, muestra los 15 polígonos del mock, permite alternar ICVSA numérico/semaforizado y muestra el mapa de calor LST con leyenda en °C, sin desbordes en escritorio y móvil. |
| T1-02 | Proxy WMS seguro y cliente tipado | Alta | 6 | `src/app/api/gamc/wms/route.ts` y `src/services/wms/` | Valida `service_id`, operación, `BBOX`, `WIDTH`, `HEIGHT` y `FORMAT`; cachea; devuelve errores del contrato; la clave nunca llega al cliente. |
| T1-03 | Gestor de capas WMS, leyendas y degradación | Alta | 6 | `src/components/map/LayerControl.tsx` | Activa/desactiva capas, ajusta opacidad, muestra leyenda y estado de carga/error; si el WMS falla, el mapa base y el mock siguen funcionando. |
| T1-04 | Rutas de transporte y paradas propuestas | Alta | 6 | `src/components/map/TransportLayer.tsx` | Dibuja rutas y paradas del mock, agrupa puntos, filtra por distrito/ruta y distingue `boarding_recommended` con texto e icono; rotula que son propuestas ilustrativas, no paradas oficiales ni seguras. |
| T1-05 | Estado de mapa, comparación y eventos de selección | Alta | 6 | `src/components/map/useMapUrlState.ts` y controles de selección | Lee y escribe `?district=&districts=&year=&variable=&view=&layers=`; permite seleccionar dos distritos para comparación; un enlace restaura la vista; emite `geoqocha:district-selected` sin importar componentes de DEV3. |
| T1-06 | Rendimiento, accesibilidad, pruebas y README del mapa | Alta | 6 | Pruebas y documentación en `src/components/map/` | Carga diferida del mapa, foco visible, contraste, `prefers-reduced-motion`, pruebas de validación WMS y README con variables de entorno. |

### 6.2 DEV2 — Datos NASA, pipeline y backend de IA

| ID | Tarea | Complejidad | Horas | Entregable | Criterio de aceptación |
|---|---|---|---:|---|---|
| T2-01 | Esqueleto del pipeline y contrato de datos reales | Alta | 6 | `scripts/run.py`, `scripts/config.py`, `scripts/validate_output.py` | Lee el GeoJSON distrital, define rutas de entrada/salida y genera un `distritos_data.json` con la misma forma que el mock; falla si faltan 15 distritos o años. |
| T2-02 | Procesamiento NDVI y LST 2015–2025 | Alta | 6 | `scripts/nasa/` | Procesa MOD13Q1 y MOD11A2 colección 6.1, aplica QA, convierte LST a °C, usa ventana estacional fija y calcula media, conteo y fracción válida por distrito-año. |
| T2-03 | Integración territorial, índice, brechas, correlaciones y hotspots | Alta | 6 | `scripts/indicators/`, `data/processed/`, `src/backend/data/`, `src/app/api/` y `data/metadata/sources.json` | Une población, equipamiento y movilidad con `territorial_reference_year`; calcula ICVSA, `index_without_territorial`, tendencias, brechas frente al promedio municipal, correlaciones exploratorias y hotspots con reglas explicables; expone los datos procesados mediante los route handlers del contrato; no interpola ni usa cero para faltantes. |
| T2-04 | RAG ligero sobre `distritos_data.json` | Alta | 6 | `src/backend/ai/retrieval.ts` y `src/backend/ai/context.ts` | Indexa fragmentos por distrito, año y métrica; recupera contexto acotado; arma citas y respeta un presupuesto de tokens; no usa base vectorial externa. |
| T2-05 | Endpoint `/api/ai-analyst` | Alta | 6 | `src/app/api/ai-analyst/route.ts` y `src/backend/ai/provider.ts` | Acepta `chat` y `diagnosis`; cubre demografía, déficit de equipamiento y deforestación; usa Gemini u OpenAI solo en servidor; aplica timeout, reintento y rate limit; devuelve `AIResponse` o `fallback_used: true`. |
| T2-06 | Guardrails, pruebas y README de IA | Alta | 6 | `src/backend/ai/guardrails.ts`, pruebas y README | Verifica consistencia numérica contra el contexto, exige citas, resiste inyección de prompt, documenta costos, límites y variables de entorno sin secretos. |

### 6.3 DEV3 — Analítica, concientización y chat UI

| ID | Tarea | Complejidad | Horas | Entregable | Criterio de aceptación |
|---|---|---|---:|---|---|
| T3-01 | Panel derecho, ficha distrital y comparador | Alta | 6 | `src/components/analytics/DistrictPanel.tsx` y `src/components/analytics/ComparisonPanel.tsx` | Abre/cierra con teclado, atrapa el foco, lee `district` y `districts` de la URL, permite comparar dos distritos lado a lado, muestra carga/vacío/error y no desborda en móvil. |
| T3-02 | Fichas demográficas, brechas y series con Recharts | Alta | 6 | `src/components/analytics/` | Muestra población, brechas frente al promedio municipal, brechas de salud/educación, NDVI/LST/ICVSA 2015–2025, calidad del dato y «no disponible» para `null`; tooltips accesibles. |
| T3-03 | Deforestación y concientización ambiental | Alta | 6 | `src/components/awareness/` | Presenta estrategias basadas en datos, mensajes ciudadanos y citas de fuente; no afirma causalidad ni inventa cifras; distingue datos ilustrativos. |
| T3-04 | Widget flotante de chat IA | Alta | 6 | `src/components/ai/ChatWidget.tsx` | Envía mensajes al endpoint, muestra historial, carga, error, reintento, citas y advertencia; usa un fixture local si la API no está disponible. |
| T3-05 | Tarjetas de diagnóstico automático | Alta | 6 | `src/components/ai/DiagnosisCards.tsx` | Consume `mode: "diagnosis"`, renderiza `insights`, severidad, evidencia y citas; permite reintentar; no se rompe si la API falla. |
| T3-06 | Hotspots, metodología, fuentes, calidad y pruebas de analítica | Alta | 6 | `src/components/analytics/HotspotsPanel.tsx`, `src/components/analytics/MethodologyPanel.tsx`, `src/components/analytics/SourcesPanel.tsx` y pruebas | Renderiza hotspots con reglas activadas y contribuciones, publica fórmula/pesos/`t_ref`/faltantes, muestra el catálogo de fuentes y mantiene responsive, contraste, foco, `prefers-reduced-motion`, estados vacíos/error y README de componentes y fixtures. |

### 6.4 Verificación de equidad

| Frente | Tareas | Horas nominales | Tareas de base | Tareas núcleo | Integración interna | Calidad | Pruebas/docs |
|---|---:|---:|---:|---:|---:|---:|---:|
| DEV1 | 6 | 36 | 1 | 2 | 1 | 1 | 1 |
| DEV2 | 6 | 36 | 1 | 2 | 1 | 1 | 1 |
| DEV3 | 6 | 36 | 1 | 2 | 1 | 1 | 1 |

> La equidad es estructural: misma cantidad de tareas, mismo peso y misma distribución de riesgos. Si una tarea se cae, se reemplaza por otra del mismo frente y peso; no se reasigna trabajo entre personas.

---

## 7. Cronograma de 48 horas

| Bloque | DEV1 | DEV2 | DEV3 | Hito |
|---|---|---|---|---|
| 0–6 h | T-00 compartido | T-00 compartido | T-00 compartido | Contrato y mock congelados |
| 6–12 h | T1-01 shell y mapa | T2-01 esqueleto del pipeline | T3-01 panel deslizable | Primer vertical slice con mock |
| 12–18 h | T1-02 proxy WMS | T2-02 NDVI/LST | T3-02 fichas y gráficos | Mapa, datos y panel funcionando por separado |
| 18–24 h | T1-03 gestor de capas | T2-03 índice y hotspots | T3-03 concientización | Núcleo de cada frente completo |
| 24–30 h | T1-04 transporte y paradas | T2-04 RAG ligero | T3-04 chat UI | Funciones diferenciales visibles |
| 30–36 h | T1-05 URL y eventos | T2-05 endpoint de IA | T3-05 diagnóstico automático | Cada frente listo para integrar |
| 36–42 h | T1-06 calidad del mapa | T2-06 guardrails y pruebas | T3-06 calidad de UI | Ramas verdes y documentadas |
| 42–48 h | Integración, QA, deploy y demo | Integración, QA, deploy y demo | Integración, QA, deploy y demo | MVP desplegado y ensayado |

### Hitos verificables

| Hito | Momento | Criterio |
|---|---|---|
| H0 — Contrato congelado | h 6 | Tipos, mock, tag y ramas listas. |
| H1 — Vertical slices | h 18 | Mapa con mock, panel con mock y pipeline mínimo ejecutable. |
| H2 — Núcleo completo | h 30 | WMS, índice, series, RAG y chat funcionando por separado. |
| H3 — Ramas listas | h 42 | CI verde en las tres ramas y PRs revisados. |
| H4 — MVP integrado | h 45 | Composición visual, datos reales o mock declarado, IA con fallback. |
| H5 — Demo | h 48 | Deploy, README, guion y ensayo. |

---

## 8. Contratos de integración sin acoplamiento

Los frentes no se importan entre sí. Se comunican por cuatro contratos estables.

### 8.1 Estado en la URL

```text
/?district=3&year=2025&variable=icvsa&view=semaphore&layers=green,health&panel=district
```

| Parámetro | Valores | Dueño de escritura | Consumidores |
|---|---|---|---|
| `district` | 1–15 | DEV1 y DEV3 | Ambos |
| `year` | 2015–2025 | DEV1 y DEV3 | Ambos |
| `variable` | `icvsa`, `ndvi`, `lst`, `environmental_index`, `priority` | DEV1 | DEV3 |
| `view` | `numeric`, `semaphore` | DEV1 y DEV3 | Ambos |
| `layers` | CSV de capas | DEV1 | DEV1 |
| `panel` | `district`, `chat`, `awareness` | DEV3 | DEV3 |

### 8.2 Eventos de ventana

| Evento | Payload | Emisor | Receptor |
|---|---|---|---|
| `geoqocha:district-selected` | `{ district_id: number }` | DEV1 | DEV3 |
| `geoqocha:year-changed` | `{ year: number }` | DEV1 | DEV3 |
| `geoqocha:open-diagnosis` | `{ district_id: number, year: number }` | DEV3 | DEV1 |

Los eventos son opcionales: la URL es la fuente de verdad. Si un evento falla, la vista se recupera al recargar el enlace.

### 8.3 Carga de datos

- Durante el desarrollo, todos leen `/data/mock_distritos.json`.
- En producción, `src/lib/data-source.ts` devuelve `/data/distritos_data.json` cuando `NEXT_PUBLIC_DATA_MODE=real`.
- Ambos archivos tienen la misma forma `DistrictData[]`.
- DEV2 valida que el archivo real cumpla el contrato antes de publicarlo.
- Si el archivo real no existe, la app vuelve al mock y muestra una etiqueta de «datos ilustrativos».

### 8.4 Contrato de IA

- DEV3 consume `POST /api/ai-analyst` con `AIRequest`.
- DEV2 garantiza `AIResponse` y errores del contrato.
- Si el endpoint falla, DEV3 usa un fixture local de `AIResponse` marcado como ilustrativo.
- Ningún componente de DEV3 llama directamente a Gemini u OpenAI.
- Ninguna respuesta de IA se muestra sin `citations` y `disclaimer`.

---

## 9. Estrategia Git y merge sin conflictos

### 9.1 Secuencia operativa

```bash
# Día 0, una sola persona del equipo
git checkout dev
git checkout -b chore/contract-v0.1.0
# crear contrato, mock y andamiaje
git push -u origin chore/contract-v0.1.0
# PR a dev, revisión de los tres, merge y tag
git checkout dev && git pull
git tag contract-v0.1.0 && git push origin contract-v0.1.0

# Cada desarrollador
git checkout dev && git pull
git checkout -b feat/dev1-map-transport
# commits pequeños y frecuentes
git fetch origin && git rebase origin/dev
git push -u origin feat/dev1-map-transport
# PR a dev
```

### 9.2 Orden de merge

| Orden | Rama | Condición |
|---:|---|---|
| 1 | `chore/contract-v0.1.0` | Aprobación de los tres y CI verde |
| 2 | `feat/dev1-map-transport` | CI verde y una aprobación |
| 3 | `feat/dev2-data-ai` | CI verde y una aprobación |
| 4 | `feat/dev3-analytics-chat` | CI verde y una aprobación |
| 5 | `dev` → `main` | Integración validada y demo ensayada |

El orden 2–4 es intercambiable. Si dos PR tocan un archivo compartido, se rechazan y se resuelve primero el PR de contrato.

### 9.3 Protocolo de conflicto

1. Detener el merge.
2. Identificar si el conflicto es de carpeta exclusiva o de archivo compartido.
3. Si es de carpeta exclusiva, resolver en la rama del dueño.
4. Si es de archivo compartido, abrir `contract/*` y aprobar entre los tres.
5. No usar `--force` ni reescribir la historia de `dev`.

---

## 10. Definición de terminado (DoD)

Una tarea está terminada cuando:

- [ ] Cumple el criterio de aceptación de su tabla.
- [ ] `npm run lint`, `npm run typecheck` y `npm test` pasan.
- [ ] No expone claves del GAMC ni del proveedor de IA.
- [ ] Maneja `null`, vacío, error y carga de forma explícita.
- [ ] Distingue datos reales de ilustrativos.
- [ ] La IA incluye citas, advertencia y `fallback_used` cuando corresponde.
- [ ] La interfaz es usable con teclado y en móvil.
- [ ] Tiene revisión de al menos otra persona del equipo.
- [ ] Actualiza `MEMORY.md` si cambió una decisión o un contrato.

---

## 11. Riesgos y contingencias

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Deriva del contrato | Bloquea a los tres frentes | Congelar en el Día 0; cambios solo por PR `contract/*`. |
| WMS del GAMC caído | Capas municipales no visibles | Caché, capas estáticas y modo degradado con aviso. |
| Clave del GAMC ausente | No se puede probar el proxy | Mock de respuestas WMS y validación con `service_id` ficticio. |
| Proveedor de IA sin clave o caído | Chat y diagnóstico no responden | Fallback basado en reglas y fixture local ilustrativo. |
| Alucinación de la IA | Cifras o conclusiones falsas | Inyectar solo hechos del dataset, exigir citas, validar números y mostrar advertencia. |
| Costo o latencia de IA | Demo lenta o cara | Límite de tokens, timeout, caché de diagnósticos y rate limit. |
| Datos NASA incompletos | Series con huecos | Publicar años disponibles, `null` y `data_quality_flag`. |
| Vectores GAMC incompletos | Índice territorial parcial | Marcar `insufficient_data` y no inventar valores. |
| Paradas «seguras» sin fuente oficial | Afirmación no respaldada | Presentarlas como propuesta metodológica ilustrativa, no como seguridad oficial. |
| Conflicto de merge | Retraso en la integración | Propiedad de carpetas, archivos compartidos congelados y PR pequeños. |
| Ausencia de un desarrollador | Frente incompleto | README por frente y revisión cruzada; recortar P1 de ese frente. |
| Sobreingeniería | No se llega al MVP | Sin base de datos, sin autenticación y sin estado global complejo. |

### Plan de contingencia

1. **Sin datos reales:** el mock sigue siendo la fuente de demo, claramente etiquetado.
2. **Sin WMS:** el mapa base, el mock y los indicadores siguen funcionando.
3. **Sin IA:** el chat responde con reglas y el diagnóstico muestra tarjetas basadas en el dataset.
4. **Sin una capa municipal:** se declara `insufficient_data`; no se estima desde píxeles del WMS.
5. **Sin paradas oficiales:** se muestran solo como puntos propuestos y se retira la palabra «segura» de la UI si no hay evidencia.
6. **Retraso en un frente:** se recorta P1 de ese frente antes de tocar el P0 de los demás.

---

## 12. Guion de demo (5 minutos)

| Minuto | Acción | Responsable |
|---|---|---|
| 0:00–0:35 | Problema: datos dispersos sobre 15 distritos y necesidad de decisiones informadas. | DEV2 |
| 0:35–1:20 | Mapa full-screen, capas WMS del GAMC y rutas de transporte con paradas propuestas. | DEV1 |
| 1:20–2:10 | Ficha distrital: población, brechas, NDVI/LST/ICVSA y calidad del dato. | DEV3 |
| 2:10–2:45 | Deforestación y concientización: qué cambia y qué se puede hacer. | DEV3 |
| 2:45–3:35 | Copiloto IA: chat libre y diagnóstico automático con citas y advertencia. | DEV2 y DEV3 |
| 3:35–4:20 | Metodología, `territorial_reference_year`, fuentes, límites y fallback. | DEV2 |
| 4:20–5:00 | Arquitectura abierta, independencia de ramas, licencia y cierre. | DEV1 |

---

## 13. Después del hackathon

| Fase | Objetivo |
|---|---|
| Corto plazo | Reemplazar el mock por datos validados, completar metadatos y revisar licencias. |
| Medio plazo | Validar paradas propuestas con el GAMC, incorporar más capas y migrar a PostgreSQL + PostGIS. |
| Largo plazo | Automatizar el pipeline, versionar el índice, publicar API abierta y ampliar a otras ciudades. |

### Deuda técnica esperada

- Mock y datos reales conviviendo con un selector de entorno.
- RAG sobre JSON, sin base vectorial.
- Caché del proxy y del diagnóstico en memoria.
- Cobertura de pruebas limitada.
- Paradas de transporte sin validación oficial de seguridad.
- Accesibilidad y responsive parciales.

---

## 14. Checklist final de entrega

- [ ] 15 distritos con geometría y `district_id` estables.
- [ ] Contrato `contract-v0.1.0` congelado y tipos reutilizados por los tres frentes.
- [ ] Mock etiquetado como ilustrativo y reemplazable por datos reales.
- [ ] NDVI y LST 2015–2025 con calidad, conteo y fracción válida.
- [ ] ICVSA histórico con `territorial_reference_year` e `index_without_territorial`.
- [ ] WMS del GAMC por proxy seguro, sin clave en el cliente.
- [ ] Rutas y paradas propuestas con etiqueta de datos ilustrativos.
- [ ] Panel distrital, fichas demográficas y series con Recharts.
- [ ] Sección de deforestación y concientización con fuentes.
- [ ] Chat y diagnóstico con citas, advertencia y fallback.
- [ ] `/api/ai-analyst` documentado en `04-CONTRATOS-API.md`.
- [ ] `lint`, `typecheck`, `test` y `validate:mock` verdes.
- [ ] Sin secretos en el repositorio, el bundle ni los logs.
- [ ] README con despliegue, uso, fuentes y atribución.
- [ ] Demo ensayada y despliegue accesible.
