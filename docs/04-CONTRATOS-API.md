# 04 — Contratos de API

Contratos de la **API propia** de Cochabamba Verde (propuesta, no endpoints existentes del GAMC) y del **proxy WMS** hacia el municipio.

> Los valores numéricos de los ejemplos son **ficticios**: sirven para definir interfaces, no representan distritos reales.

---

## 1. Convenciones generales

| Aspecto | Definición |
|---|---|
| Base URL (local) | `http://localhost:3000/api` |
| Formato | JSON UTF-8 (`Content-Type: application/json`) |
| Versionado | Prefijo de ruta o cabecera; el MVP usa `/api` estable |
| Fechas | `YYYY-MM-DD` (ISO 8601) |
| Años | Entero de 4 dígitos |
| IDs de distrito | Entero `1..15` |
| Nulos | `null` explícito; nunca se sustituyen por `0` |
| Unidades | Declaradas en el nombre del campo (`_celsius`, `_fraction`, `_count`) |
| Enlaces compartibles | Query string de la app: `?district=3&year=2025&variable=icvsa&view=semaphore` |

### Envoltura de error

```json
{
  "error": {
    "code": "DISTRICT_NOT_FOUND",
    "message": "No existe un distrito con id 99.",
    "details": { "district_id": 99 }
  }
}
```

| Código HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `INVALID_PARAMETER` | Parámetro ausente, mal tipado o fuera de rango. |
| 404 | `DISTRICT_NOT_FOUND` | Distrito inexistente. |
| 404 | `NO_DATA` | Consulta válida sin datos para el filtro. |
| 429 | `RATE_LIMITED` | Se superó el límite de consultas. |
| 502 | `UPSTREAM_ERROR` | El WMS del GAMC falló o devolvió algo inválido. |
| 504 | `UPSTREAM_TIMEOUT` | Timeout al contactar el servicio municipal. |
| 500 | `INTERNAL_ERROR` | Error no controlado. |

---

## 2. Enumeraciones

```ts
type Variable =
  | "icvsa"                  // índice socioambiental 1–100
  | "environmental_index"    // solo NDVI + LST
  | "ndvi"
  | "lst"
  | "priority"
  | "equipment"
  | "mobility";

type IndexView = "numeric" | "semaphore";

type Aggregation = "annual" | "monthly";

type DataQualityFlag = "ok" | "partial" | "insufficient";

type TrendDirection = "improving" | "stable" | "worsening" | "undetermined";

type PriorityLevel = "low" | "medium" | "high" | "insufficient_data";

type GamcOperation = "GetMap" | "GetLegendGraphic" | "GetFeatureInfo";
```

---

## 3. Tipos compartidos

```ts
/** Registro anual de un distrito. */
interface DistrictYearRecord {
  district_id: number;
  year: number;

  ndvi_mean: number | null;                     // -1 .. 1
  ndvi_valid_observation_count: number | null;  // conteo
  ndvi_valid_pixel_fraction: number | null;     // 0 .. 1

  lst_mean_celsius: number | null;              // °C
  lst_valid_pixel_fraction: number | null;      // 0 .. 1

  environmental_index: number | null;           // 1 .. 100 (NDVI + LST)
  socioenvironmental_index: number | null;      // 1 .. 100 (ICVSA)
  index_without_territorial: number | null;     // 1 .. 100, sensibilidad
  territorial_reference_year: number | null;    // t_ref de equipamiento/movilidad
  equipment_access_index: number | null;        // 0 .. 100
  mobility_access_index: number | null;         // 0 .. 100

  data_quality_flag: DataQualityFlag;
  source_refs: string[];                        // ids de data/metadata/sources.json
}

/** Métricas de equipamiento y movilidad por distrito. */
interface EquipmentMetrics {
  district_id: number;
  territorial_reference_year: number;
  population: number | null;
  green_area_m2_per_capita: number | null;
  schools_per_1000: number | null;
  health_centers_per_1000: number | null;
  transport_coverage_fraction: number | null;   // 0 .. 1
  equipment_access_index: number | null;        // 0 .. 100
  mobility_access_index: number | null;         // 0 .. 100
  deficit_flags: string[];                      // ej. ["GREEN_AREA_LOW"]
}

/** Resumen territorial de un distrito. */
interface DistrictSummary {
  district_id: number;
  name: string;
  area_km2: number | null;
  population: number | null;
  population_year: number | null;
  last_data_year: number | null;
  territorial_reference_year: number | null;
  latest_socioenvironmental_index: number | null;
}

/** Tendencia calculada de una variable. */
interface Trend {
  variable: "ndvi" | "lst" | "environmental_index" | "socioenvironmental_index";
  direction: TrendDirection;
  slope_per_year: number | null;
  unit: string;
  years_used: number[];
  method: string;          // ej. "OLS sobre medias anuales"
  is_significant: boolean | null;
  acceleration: number | null;   // pendiente 2020–2025 menos 2015–2020
  accelerated: boolean;          // true si la aceleración supera el umbral
  notes: string[];
}

/** Resultado exploratorio de relación entre ambiente y acceso. */
interface CorrelationResult {
  x_variable: "ndvi_trend" | "lst_trend" | "environmental_index_trend";
  y_variable: "equipment_access_index" | "mobility_access_index";
  coefficient: number | null;    // Pearson o Spearman, según método
  method: "pearson" | "spearman";
  n: number;
  p_value: number | null;
  interpretation: string;        // lectura textual, sin causalidad
  districts: Array<{
    district_id: number;
    district_name: string;
    x: number | null;
    y: number | null;
  }>;
}

/** Regla que activó una marca de hotspot. */
interface HotspotRule {
  rule_id: string;         // ej. "NDVI_NEGATIVE_TREND"
  variable: "ndvi" | "lst" | "environmental_index" | "socioenvironmental_index" | "equipment" | "mobility" | "coverage";
  description: string;
  observed_value: number | null;
  threshold: number | null;
  triggered: boolean;
}

interface Hotspot {
  district_id: number;
  district_name: string;
  year: number;
  priority_level: PriorityLevel;
  score: number | null;
  rules: HotspotRule[];
  explanation: string;
}

/** Metadatos de una fuente de datos. */
interface SourceMetadata {
  id: string;
  name: string;
  organization: string;
  url: string;
  reference_date: string | null;
  license: string | null;
  transformations: string[];
  limitations: string[];
}
```

> El contrato completo de una fila distrito-año está en [`02-REQUERIMIENTOS.md`](./02-REQUERIMIENTOS.md#diccionario-mínimo-de-campos-distrito-año).

---

## 4. Endpoints propios

### 4.1 `GET /api/districts`

Devuelve el catálogo de distritos y, opcionalmente, su geometría para el mapa.

**Query params**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `include_geometry` | `boolean` | No (default `false`) | Incluye el polígono GeoJSON. |

**Respuesta 200**

```json
{
  "count": 15,
  "districts": [
    {
      "district_id": 3,
      "name": "Distrito 3",
      "area_km2": 12.4,
      "population": 48210,
      "population_year": 2024,
      "last_data_year": 2025,
      "territorial_reference_year": 2024,
      "latest_socioenvironmental_index": 64
    }
  ]
}
```

Con `include_geometry=true`, cada elemento añade:

```json
{
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[-66.18, -17.39], [-66.17, -17.39], [-66.17, -17.38], [-66.18, -17.39]]]
  }
}
```

---

### 4.2 `GET /api/districts/:id`

Ficha resumida de un distrito.

**Respuesta 200**

```json
{
  "district_id": 3,
  "name": "Distrito 3",
  "area_km2": 12.4,
  "population": 48210,
  "population_year": 2024,
  "latest": {
    "year": 2025,
    "ndvi_mean": 0.42,
    "lst_mean_celsius": 29.5,
    "environmental_index": 67,
    "socioenvironmental_index": 64,
    "index_without_territorial": 67,
    "territorial_reference_year": 2024,
    "data_quality_flag": "ok"
  },
  "trends": [
    {
      "variable": "ndvi",
      "direction": "stable",
      "slope_per_year": -0.002,
      "unit": "NDVI/año",
      "years_used": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      "method": "OLS sobre medias anuales",
      "is_significant": null,
      "acceleration": -0.001,
      "accelerated": false,
      "notes": ["Pendiente pequeña comparada con la variabilidad anual."]
    }
  ],
  "sources": ["nasa_mod13q1", "nasa_mod11a2", "gamc_districts"],
  "summary_text": "El Distrito 3 mantiene una condición intermedia: su vegetación es estable y su temperatura superficial aumentó ligeramente. El componente territorial usa datos de 2024."
}
```

**Errores:** `400 INVALID_PARAMETER` si `id` no es entero; `404 DISTRICT_NOT_FOUND`.

---

### 4.3 `GET /api/districts/:id/indicators`

Serie histórica distrito-año.

**Query params**

| Param | Tipo | Requerido | Default | Validación |
|---|---|---|---|---|
| `from` | entero | No | 2015 | `2015 <= from <= to` |
| `to` | entero | No | 2025 | `to <= año actual` |
| `variables` | CSV | No | todas | Subconjunto de `ndvi,lst,environmental_index,socioenvironmental_index` |
| `aggregation` | enum | No | `annual` | `annual` \| `monthly`; si no hay mensual, devuelve anual |

**Respuesta 200**

```json
{
  "district_id": 3,
  "district_name": "Distrito 3",
  "from": 2015,
  "to": 2025,
  "series": [
    {
      "district_id": 3,
      "year": 2024,
      "ndvi_mean": 0.43,
      "ndvi_valid_observation_count": 16,
      "ndvi_valid_pixel_fraction": 0.88,
      "lst_mean_celsius": 28.9,
      "lst_valid_pixel_fraction": 0.84,
      "environmental_index": 69,
      "socioenvironmental_index": 66,
      "index_without_territorial": 69,
      "territorial_reference_year": 2024,
      "equipment_access_index": 58,
      "mobility_access_index": 61,
      "data_quality_flag": "ok",
      "source_refs": ["nasa_mod13q1", "nasa_mod11a2", "gamc_equipment", "gamc_transport"]
    },
    {
      "district_id": 3,
      "year": 2025,
      "ndvi_mean": 0.42,
      "ndvi_valid_observation_count": 14,
      "ndvi_valid_pixel_fraction": 0.81,
      "lst_mean_celsius": 29.5,
      "lst_valid_pixel_fraction": 0.81,
      "environmental_index": 67,
      "socioenvironmental_index": 64,
      "index_without_territorial": 67,
      "territorial_reference_year": 2024,
      "equipment_access_index": 58,
      "mobility_access_index": 61,
      "data_quality_flag": "ok",
      "source_refs": ["nasa_mod13q1", "nasa_mod11a2", "gamc_equipment", "gamc_transport"]
    }
  ],
  "metadata": {
    "generated_at": "2026-11-10T12:00:00Z",
    "methodology_version": "0.1.0",
    "notes": ["LST es temperatura superficial, no temperatura del aire."]
  }
}
```

**Contrato de completitud:** la respuesta incluye **un elemento por año del rango solicitado**. Los años sin datos llevan `null` en las variables y `data_quality_flag: "insufficient"`.

---

### 4.4 `GET /api/comparison`

Comparación de dos o más distritos en un año o periodo.

**Query params**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `districts` | CSV de enteros | Sí | 2 a 5 ids. |
| `year` | entero | Sí | Año de comparación. |
| `variables` | CSV | No | Variables a incluir. |

**Respuesta 200**

```json
{
  "year": 2025,
  "districts": [
    {
      "district_id": 3,
      "district_name": "Distrito 3",
      "values": {
        "ndvi": 0.42,
        "lst": 29.5,
        "environmental_index": 67,
        "socioenvironmental_index": 64,
        "equipment_access_index": 58,
        "mobility_access_index": 61
      },
      "data_quality_flag": "ok"
    },
    {
      "district_id": 9,
      "district_name": "Distrito 9",
      "values": {
        "ndvi": 0.31,
        "lst": 31.8,
        "environmental_index": 48,
        "socioenvironmental_index": 45,
        "equipment_access_index": 39,
        "mobility_access_index": 44
      },
      "data_quality_flag": "partial"
    }
  ],
  "gaps_vs_municipal_average": [
    { "district_id": 3, "variable": "socioenvironmental_index", "absolute": 6, "relative_percent": 10.3 },
    { "district_id": 9, "variable": "socioenvironmental_index", "absolute": -13, "relative_percent": -22.4 }
  ],
  "differences": [
    {
      "variable": "environmental_index",
      "from_district": 3,
      "to_district": 9,
      "absolute": 19,
      "relative_percent": 39.6
    }
  ],
  "warnings": ["Distrito 9 tiene cobertura parcial de píxeles LST en 2025."]
}
```

**Errores:** `400 INVALID_PARAMETER` si hay menos de 2 distritos o año fuera de rango.

---

### 4.5 `GET /api/hotspots`

Ranking de distritos que ameritan análisis adicional.

**Query params**

| Param | Tipo | Requerido | Default |
|---|---|---|---|
| `year` | entero | No | último año con datos |
| `min_priority` | enum | No | `medium` |

**Respuesta 200**

```json
{
  "year": 2025,
  "methodology_version": "0.1.0",
  "disclaimer": "Clasificación indicativa basada en reglas explícitas. No es una evaluación oficial del GAMC ni una priorización de inversión.",
  "hotspots": [
    {
      "district_id": 9,
      "district_name": "Distrito 9",
      "year": 2025,
      "priority_level": "high",
      "score": 72.5,
      "rules": [
        {
          "rule_id": "LST_POSITIVE_TREND",
          "variable": "lst",
          "description": "Tendencia de LST positiva por encima del umbral.",
          "observed_value": 0.18,
          "threshold": 0.1,
          "triggered": true
        },
        {
          "rule_id": "NDVI_NEGATIVE_TREND",
          "variable": "ndvi",
          "description": "Tendencia de NDVI negativa.",
          "observed_value": -0.004,
          "threshold": -0.002,
          "triggered": true
        },
        {
          "rule_id": "EQUIPMENT_DEFICIT",
          "variable": "equipment",
          "description": "Área verde por habitante por debajo del umbral.",
          "observed_value": 2.1,
          "threshold": 4.0,
          "triggered": true
        }
      ],
      "explanation": "Combina calentamiento superficial, pérdida de vigor vegetal y déficit de áreas verdes; requiere estudio adicional."
    }
  ]
}
```

---

### 4.6 `GET /api/methodology`

Metodología publicada y consumible por la interfaz.

**Respuesta 200**

```json
{
  "version": "0.1.0",
  "index": {
    "name": "Índice de Calidad de Vida Socio-Ambiental (ICVSA)",
    "scale": [1, 100],
    "views": ["numeric", "semaphore"],
    "formula": "ICVSA(d,t) = 0.35*S_ndvi(d,t) + 0.35*S_lst(d,t) + 0.20*S_equipment(d,t_ref) + 0.10*S_mobility(d,t_ref)",
    "weights": {
      "vegetation": 0.35,
      "surface_temperature": 0.35,
      "urban_equipment": 0.2,
      "mobility": 0.1
    },
    "temporal_policy": {
      "environmental": "annual",
      "territorial": "fixed_at_reference_year",
      "territorial_reference_year": 2024,
      "interpolation_allowed": false
    },
    "sensitivity": {
      "field": "index_without_territorial",
      "description": "ICVSA calculado solo con NDVI y LST."
    },
    "normalization": "Min-max fijo sobre el periodo de comparación, con referencia documentada.",
    "missing_data_policy": "Excluir del cálculo e informar cobertura; nunca imputar cero.",
    "classification": [
      { "range": [70, 100], "label": "Condición relativa favorable" },
      { "range": [40, 69], "label": "Condición intermedia" },
      { "range": [1, 39], "label": "Condición de atención" }
    ]
  },
  "disclaimer": "Indicador sintético de apoyo al análisis; no mide bienestar de forma definitiva."
}
```

---

### 4.7 `GET /api/sources`

Catálogo de fuentes y metadatos.

**Respuesta 200**

```json
{
  "sources": [
    {
      "id": "nasa_mod13q1",
      "name": "MODIS MOD13Q1 (NDVI), colección 6.1",
      "organization": "NASA",
      "url": "https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1",
      "reference_date": "2015/2025",
      "license": "NASA open data (verificar términos)",
      "transformations": ["Máscara QA", "Agregación zonal por distrito", "Media anual"],
      "limitations": ["Resolución 250 m", "Variabilidad estacional"]
    }
  ]
}
```

---

### 4.8 `GET /api/health`

```json
{
  "status": "ok",
  "uptime_seconds": 3600,
  "data": { "last_processed_year": 2025, "methodology_version": "0.1.0" },
  "dependencies": { "gamc_wms": "reachable" }
}
```

`status` puede ser `ok` o `degraded` (por ejemplo, WMS inaccesible pero datos locales disponibles).

---

### 4.9 `GET /api/heatmap`

Mapa de calor precalculado por el pipeline.

**Query params**

| Param | Tipo | Requerido | Default | Validación |
|---|---|---|---|---|
| `variable` | enum | No | `lst` | `lst` \| `severity` \| `icvsa` |
| `year` | entero | No | último año | 2015–2025 |
| `format` | enum | No | `cells` | `cells` \| `raster` |

**Respuesta 200 (`format=cells`)**

```json
{
  "variable": "lst",
  "year": 2025,
  "unit": "°C",
  "resolution_m": 1000,
  "method": "Media zonal MOD11A2 por distrito; celdas agregadas para visualización.",
  "cells": [
    { "district_id": 3, "latitude": -17.38, "longitude": -66.17, "value": 29.5, "class": "medium" },
    { "district_id": 9, "latitude": -17.41, "longitude": -66.12, "value": 33.1, "class": "high" }
  ]
}
```

**Respuesta 200 (`format=raster`)**

```json
{
  "variable": "lst",
  "year": 2025,
  "raster_url": "/api/heatmap/2025/lst.png",
  "bbox": [-66.2493, -17.502865, -66.085546, -17.335849],
  "attribution": "NASA MODIS MOD11A2 / GAMC"
}
```

> Los mapas de calor son **apoyo visual**; las cifras oficiales del contrato son las de `/indicators`.

---

### 4.10 `GET /api/analysis/correlation`

Relación exploratoria entre tendencia ambiental y acceso territorial.

**Query params**

| Param | Tipo | Requerido | Default | Validación |
|---|---|---|---|---|
| `x` | enum | No | `ndvi_trend` | `ndvi_trend` \| `lst_trend` \| `environmental_index_trend` |
| `y` | enum | No | `equipment_access_index` | `equipment_access_index` \| `mobility_access_index` |
| `method` | enum | No | `spearman` | `pearson` \| `spearman` |

**Respuesta 200**

```json
{
  "x_variable": "ndvi_trend",
  "y_variable": "equipment_access_index",
  "coefficient": -0.41,
  "method": "spearman",
  "n": 15,
  "p_value": 0.13,
  "interpretation": "Relación negativa débil y no concluyente con 15 distritos; no implica causalidad.",
  "districts": [
    { "district_id": 3, "district_name": "Distrito 3", "x": -0.002, "y": 58 },
    { "district_id": 9, "district_name": "Distrito 9", "x": -0.004, "y": 39 }
  ],
  "disclaimer": "Análisis exploratorio. No establecer causalidad ni priorizar inversión con este resultado."
}
```

**Errores:** `404 NO_DATA` si `n < 8`; en ese caso la vista muestra solo la tabla de distritos.

---

## 5. Proxy WMS del GAMC

### 5.1 Regla de oro

El cliente **nunca** envía ni conoce la `key`. El backend la añade y valida todo lo demás.

### 5.2 `GET /api/gamc/wms`

**Parámetros aceptados** (reenviados al servicio municipal tras validación)

| Param | Requerido | Validación |
|---|---|---|
| `service_id` | Sí | Debe estar en `GAMC_ALLOWED_SERVICE_IDS`. |
| `REQUEST` | Sí | `GetMap`, `GetLegendGraphic` o `GetFeatureInfo`. |
| `SERVICE` | Condicional | Forzado a `WMS`. |
| `VERSION` | Condicional | `1.1.1` para mapas/consultas; `1.0.0` para leyendas. |
| `LAYERS` | No | Se envía vacío según la documentación del catálogo. |
| `FORMAT` | Condicional | Solo `image/png` para mapas. |
| `TRANSPARENT` | No | `true` \| `false`. |
| `SRS` | Condicional | `EPSG:3857` para mapas web. |
| `BBOX` | Condicional | Cuatro números finitos, orden y rango válidos. |
| `WIDTH` / `HEIGHT` | Condicional | Enteros, `1 <= n <= 2048`. |
| `X` / `Y` | Condicional | Enteros dentro de `WIDTH`/`HEIGHT` (para `GetFeatureInfo`). |
| `QUERY_LAYERS` | Condicional | Requerido para `GetFeatureInfo` según servicio. |
| `INFO_FORMAT` | No | `application/json` cuando esté soportado. |

**Ejemplo de llamada del frontend**

```http
GET /api/gamc/wms?service_id=<UUID_AUTORIZADO>
    &SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap
    &LAYERS=&FORMAT=image/png&TRANSPARENT=true
    &SRS=EPSG:3857&BBOX=-7370000,-1930000,-7365000,-1925000
    &WIDTH=256&HEIGHT=256
```

**Respuesta exitosa:** `200` con `Content-Type: image/png` (mapa/leyenda) o `application/json` (consulta).

**Respuesta de consulta sin elementos**

```json
{
  "type": "FeatureCollection",
  "features": []
}
```

> `features: []` significa que no se identificaron elementos para esa consulta; no es un error.

**Errores del proxy**

| HTTP | `code` | Causa |
|---|---|---|
| 400 | `INVALID_PARAMETER` | Parámetro faltante, tipo inválido o fuera de rango. |
| 403 | `SERVICE_NOT_ALLOWED` | `service_id` no autorizado. |
| 403 | `OPERATION_NOT_ALLOWED` | `REQUEST` no permitido. |
| 429 | `RATE_LIMITED` | Límite de consultas excedido. |
| 502 | `UPSTREAM_ERROR` | El GAMC devolvió error o contenido inválido. |
| 504 | `UPSTREAM_TIMEOUT` | Sin respuesta en el tiempo máximo. |

### 5.3 Caché

| Recurso | TTL sugerido | Clave |
|---|---|---|
| `GetMap` | 6 h | `service_id + bbox + width + height + transparent` |
| `GetLegendGraphic` | 24 h | `service_id + version` |
| `GetFeatureInfo` | 1 min | `service_id + x + y + bbox + width + height` |

### 5.4 Cabeceras de respuesta

```http
Cache-Control: public, max-age=21600
X-Data-Source: GAMC-WMS
X-Proxy-Validated: true
```

Nunca incluir la `key` en cabeceras, logs ni mensajes de error.

---

## 6. Ejemplos de uso

```bash
# Catálogo de distritos con geometría
curl "http://localhost:3000/api/districts?include_geometry=true"

# Serie histórica de un distrito
curl "http://localhost:3000/api/districts/3/indicators?from=2015&to=2025"

# Comparación de dos distritos
curl "http://localhost:3000/api/comparison?districts=3,9&year=2025"

# Hotspots
curl "http://localhost:3000/api/hotspots?year=2025&min_priority=medium"

# Mapa de calor de LST
curl "http://localhost:3000/api/heatmap?variable=lst&year=2025&format=cells"

# Correlación exploratoria
curl "http://localhost:3000/api/analysis/correlation?x=ndvi_trend&y=equipment_access_index"

# Proxy WMS (mapa)
curl "http://localhost:3000/api/gamc/wms?service_id=<UUID>&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857&BBOX=-7370000,-1930000,-7365000,-1925000&WIDTH=256&HEIGHT=256" -o map.png
```

---

## 7. Versionado y compatibilidad

1. Cambios aditivos (nuevos campos opcionales) no rompen el contrato.
2. Cambios de significado, unidades o tipos requieren nueva versión de metodología y aviso en `metadata`.
3. El frontend tolera campos desconocidos y nulos.
4. Los datos de ejemplo siempre se marcan como ficticios.
5. `methodology_version` viaja en las respuestas relevantes para poder auditar resultados.

---

## 8. Checklist de contrato antes de integrar

- [ ] Los 15 distritos tienen `district_id` estable y nombre.
- [ ] La serie cubre todos los años del rango, con `null` donde falte dato.
- [ ] `socioenvironmental_index` existe por año y declara `territorial_reference_year`.
- [ ] `index_without_territorial` permite auditar la sensibilidad.
- [ ] El semáforo se deriva de la misma escala 1–100.
- [ ] Los mapas de calor usan datos precalculados y no bloquean la carga.
- [ ] La correlación informa `n`, método y advertencia de no causalidad.
- [ ] Las unidades están en el nombre del campo.
- [ ] Los errores usan la envoltura documentada.
- [ ] El proxy rechaza `service_id` no autorizados.
- [ ] La `key` no aparece en respuestas ni logs.
- [ ] `features: []` se trata como «sin elementos», no como fallo.
- [ ] Todo dato ilustrativo está etiquetado.
