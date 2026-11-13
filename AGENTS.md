# AGENTS.md — Guía para agentes de IA

Instrucciones de trabajo para cualquier agente que colabore en **GeoQocha**. Este archivo describe el contexto, las reglas no negociables y la forma correcta de cambiar el proyecto.

> **Vigencia 2026-11-13:** GeoQocha reemplaza a Cochabamba Verde. El MVP usa Next.js App Router con route handlers, un contrato compartido en `src/types/geoqocha.ts` y un copiloto de IA acotado. Las carpetas `frontend/` y `backend/` actuales son legado congelado hasta completar la migración.

---

## 1. Contexto del proyecto

**GeoQocha** es un tablero web interactivo y de código abierto para analizar las condiciones socioambientales de los **15 distritos municipales de Cochabamba**, Bolivia, con un copiloto de IA acotado.

| Campo | Valor |
|---|---|
| Desafío | **Be An Earth System Trend Detective!** — NASA International Space Apps Challenge 2026 |
| Sede | Cochabamba, Bolivia |
| Datos | NASA MODIS (NDVI, LST) + capas del GAMC |
| Periodo | 2015–2025 |
| Índice | ICVSA histórico 1–100, con vista semaforizada alternativa |
| Equipo de desarrollo | 3 desarrolladores de sistemas (DEV1, DEV2, DEV3) |

El proyecto tiene un **andamiaje inicial** de frontend y backend, pero aún no tiene funcionalidades de negocio. No asumas `node_modules`, datos procesados ni endpoints fuera de `/api/health`.

---

## 2. Fuente de verdad

Antes de escribir código, lee el documento que corresponda. No inventes alcance ni contratos.

| Necesitas saber | Documento |
|---|---|
| Problema, visión y usuarios | `docs/01-PROYECTO.md` |
| Qué se debe construir y con qué prioridad | `docs/02-REQUERIMIENTOS.md` |
| Componentes, stack y estructura | `docs/03-ARQUITECTURA.md` |
| Tipos, campos y endpoints | `docs/04-CONTRATOS-API.md` |
| Fuentes, productos y limitaciones | `docs/05-FUENTES-DATOS.md` |
| Orden de trabajo, tareas y entregables | `docs/06-PLAN-DESARROLLO.md` |

**Regla de conflicto:** para alcance y prioridad manda `02`; para la forma exacta de los datos manda `04`; para la infraestructura manda `03`. Si detectas una contradicción, no elijas en silencio: corrige el documento afectado y deja constancia en `MEMORY.md`.

Toda la documentación vigente vive en `docs/`.

---

## 3. Idioma y estilo

- Documentación, UI y mensajes al usuario: **español**.
- Campos de API, tipos e identificadores de código: **inglés**, tal como están definidos en `04`.
- Comentarios de código: español, breves y solo cuando aporten.
- Documentos: Markdown con tablas, sin emojis, tono técnico y verificable.
- Nombres de archivos: `kebab-case`; componentes React: `PascalCase`; variables: `camelCase`; constantes: `UPPER_SNAKE_CASE`.
- Cifras siempre con unidad y año de referencia.

---

## 4. Equipo y alcance

El plan está dimensionado para **3 desarrolladores de sistemas**. No asignes tareas a perfiles de ingeniería comercial ni de diseño gráfico; esos aportes llegan fuera de este repositorio.

| Persona | Frente | Dueño de |
|---|---|---|
| **DEV1** | Mapas, WMS y movilidad urbana | `src/components/map/`, `src/services/wms/`, `src/app/api/gamc/`, `src/backend/gamc/` |
| **DEV2** | Datos NASA, pipeline y backend de IA | `scripts/`, `data/`, `src/backend/data/`, `src/backend/ai/`, `src/app/api/ai-analyst/` |
| **DEV3** | Analítica, concientización y chat UI | `src/components/analytics/`, `src/components/awareness/`, `src/components/ai/` |

**Alcance cerrado:**

- **Día 0 (obligatorio):** T-00 contrato, mock y andamiaje.
- **P0 (obligatorio):** T1-01…T1-06, T2-01…T2-06, T3-01…T3-06.
- **P1 (solo si sobra tiempo dentro del mismo frente):** capas adicionales, serie mensual, CSV, enlaces y tarjetas compartibles.
- **P2 (posterior):** validación con especialistas, PostgreSQL/PostGIS, RAG persistente y validación oficial de paradas.

Toda función nueva exige quitar otra del mismo frente y peso. No amplíes el alcance por iniciativa propia.

---

## 5. Reglas no negociables

Estas reglas protegen la validez del producto. Violarlas invalida el trabajo aunque el código compile.

1. **Nunca expongas credenciales del GAMC.** La `key` vive solo en el backend, en variables de entorno. Jamás en el frontend, el repositorio, los logs ni la documentación.
2. **Todo acceso al GAMC pasa por el proxy propio** con lista blanca de `service_id` y operaciones permitidas.
3. **Los vectores son la fuente primaria.** No calcules áreas, conteos ni accesibilidad a partir de píxeles de un WMS.
4. **No inventes datos municipales.** Si no hay serie histórica de equipamiento, se usa `t_ref` y se declara.
5. **No interpoles ni extrapoles** valores municipales para años sin observación.
6. **`null` significa «no disponible»**, nunca cero. No imputes valores faltantes.
7. **No renormalices pesos en silencio.** Si falta una dimensión completa, publica `index_without_territorial` y marca el ICVSA como `insufficient_data`.
8. **La correlación es exploratoria.** Siempre muestra `n` y una advertencia de no causalidad. No calcules si `n < 8`.
9. **El semáforo no depende solo del color.** Acompáñalo con texto e ícono.
10. **IA generativa acotada:** solo redacta y explica hechos precalculados, con citas, validación numérica y fallback por reglas. Nunca calcula hotspots, índice, tendencias ni cifras; nunca decide prioridades.
11. **Distingue datos reales de ejemplos.** Todo dato ficticio debe estar etiquetado como tal.
12. **Respeta licencias y atribución.** Código MIT; documentación CC BY 4.0; datos municipales solo si sus términos lo permiten.
13. **No inventes paradas oficiales ni calificaciones de seguridad.** Las paradas propuestas son ilustrativas hasta que exista una fuente municipal verificada.

---

## 6. Arquitectura que debes respetar

```text
NASA MODIS ──> pipeline Python/GEE ──> data/processed/*.json
GAMC vectores/WMS ──> route handler /api/gamc/wms ──> Next.js + Leaflet + Recharts
Dataset procesado ──> RAG ligero ──> /api/ai-analyst ──> chat y diagnóstico
```

| Capa | Tecnología | Persistencia |
|---|---|---|
| Frontend | Next.js App Router, React, TypeScript, Tailwind, Leaflet, Recharts | — |
| Backend | Next.js Route Handlers (Node.js) y TypeScript | Archivos JSON/GeoJSON en el MVP |
| IA | Gemini u OpenAI con RAG ligero sobre JSON | Sin persistencia de conversaciones |
| Datos | Python y/o Google Earth Engine | `data/geojson`, `data/processed`, `data/metadata` |
| Futuro | PostgreSQL + PostGIS | Solo fuera del MVP |

**Estructura objetivo del repositorio:**

```text
src/app/
src/components/{map,analytics,awareness,ai}/
src/services/wms/
src/backend/{gamc,data,ai}/
src/types/
public/data/
scripts/
data/{geojson,processed,metadata}/
docs/
.env.example
LICENSE
README.md
```

**Decisiones de arquitectura vigentes:** AD-01 a AD-11 en `docs/03-ARQUITECTURA.md` §6. No las contradigas sin actualizar el documento y `MEMORY.md`.

---

## 7. Contratos de API

El contrato es **contract-first**: primero se define en `docs/04-CONTRATOS-API.md`, después se implementa. Un cambio de campos o endpoints exige actualizar `04` en el mismo cambio.

**Endpoints definidos:**

| Endpoint | Uso |
|---|---|
| `GET /api/districts` | Distritos y resumen |
| `GET /api/districts/:id` | Ficha del distrito |
| `GET /api/districts/:id/indicators` | Serie NDVI/LST/ICVSA |
| `GET /api/comparison` | Comparación y brechas |
| `GET /api/hotspots` | Hotspots explicados |
| `GET /api/heatmap` | Mapa de calor precalculado |
| `GET /api/analysis/correlation` | Relación exploratoria |
| `GET /api/methodology` | Fórmula, pesos y política temporal |
| `GET /api/sources` | Catálogo de fuentes |
| `GET /api/health` | Estado del servicio |
| `GET /api/gamc/wms` | Proxy WMS con lista blanca |
| `POST /api/ai-analyst` | Chat y diagnóstico con RAG acotado |

**Tipos compartidos:** `DistrictData`, `DistrictGeometry`, `DistrictSeriesPoint`, `DistrictTrend`, `EquipmentMetrics`, `StopPoint`, `DataStatus`, `RiskLevel`, `AIRequest`, `AIResponse`, `AIInsight`, `AIEvidence`, `AICitation`.

**Convenciones:**

- Unidades en el nombre del campo: `_celsius`, `_fraction`, `_count`.
- Años como entero de 4 dígitos; fechas `YYYY-MM-DD`.
- Envoltura de error única: `{ error: { code, message, details } }`.
- Toda respuesta de indicadores incluye `data_quality_flag` y `source_refs`.
- El ICVSA incluye `territorial_reference_year` e `index_without_territorial`.

---

## 8. Seguridad

| Control | Implementación |
|---|---|
| Secreto GAMC | `GAMC_API_KEY` en `.env`, nunca versionado |
| Secreto IA | `AI_API_KEY` solo en el servidor; nunca `NEXT_PUBLIC_*` |
| Lista blanca | `GAMC_ALLOWED_SERVICE_IDS` |
| Validación | `REQUEST`, `BBOX`, `WIDTH`, `HEIGHT`, `FORMAT` con rangos estrictos |
| Operaciones | Solo `GetMap`, `GetLegendGraphic`, `GetFeatureInfo` |
| Caché | Tiles y consultas cacheadas |
| Límites | Rate limit y tamaño máximo de respuesta |
| CORS | Restringido a `CORS_ORIGIN` |
| Logs | Sin `key` ni parámetros sensibles |

Variables de entorno previstas:

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

## 9. Procesamiento de datos

1. Valida el GeoJSON: 15 polígonos, CRS documentado, topología correcta.
2. Normaliza `district_id` entre fuentes antes de unir nada.
3. Procesa MOD13Q1 (NDVI, 250 m, 16 días) y MOD11A2 (LST, 1 km, 8 días), colección 6.1.
4. Aplica bandas QA, filtros de nubosidad y conversión de LST a °C.
5. Agrega en ventanas anuales estables; la ventana estacional de NDVI debe ser la misma en todos los años.
6. Registra observaciones válidas y fracción de píxeles válidos por distrito-año.
7. Construye tendencias y, si está en alcance, aceleración por subperiodos.
8. Integra equipamiento y movilidad con `territorial_reference_year` y calcula el ICVSA.
9. Genera hotspots, brechas, correlación y celdas de mapa de calor.
10. Publica todo en `data/processed/` con metadatos en `data/metadata/sources.json`.

**Productos esperados:** `distritos_data.json`, `districts.geojson`, `transport.geojson`, `equipment.geojson`, `district_year.json`, `district_month.json`, `trends.json`, `equipment_metrics.json`, `hotspots.json`, `correlations.json`, `heatmap_lst.json`, `index.json`, `sources.json`. El mock de desarrollo vive en `public/data/mock_distritos.json`.

---

## 10. Flujo de trabajo

1. **Lee antes de escribir.** Identifica el requerimiento (`RF`, `RNF`, `RN`) y la tarea (`T-xx`) que estás resolviendo.
2. **Contrato primero.** Si cambias la respuesta de la API, actualiza `docs/04-CONTRATOS-API.md`.
3. **Un dueño por frente.** DEV1 no edita la UI de DEV3 sin coordinación; DEV2 no cambia contratos sin aprobación de los tres.
4. **Datos pequeños y versionables.** Los archivos procesados del MVP caben en el repositorio; no agregues imágenes satelitales crudas.
5. **Sin sobreingeniería.** Nada de base de datos, autenticación ni estado global complejo en el MVP.
6. **Degradación elegante.** Si el WMS falla, el mapa base y los indicadores deben seguir funcionando.
7. **Nombres estables.** No renombres campos del contrato sin migración y aviso.

### Definición de terminado

- [ ] Cumple el criterio de aceptación del requerimiento.
- [ ] Respeta el contrato de `04` y los tipos compartidos.
- [ ] No expone credenciales.
- [ ] Maneja `null`, vacío y error de forma explícita.
- [ ] Declara `territorial_reference_year` cuando corresponde.
- [ ] Distingue datos reales de ilustrativos.
- [ ] Tiene revisión cruzada de otra de las 3 personas.
- [ ] Actualiza `MEMORY.md` si cambió una decisión.

---

## 11. Comandos previstos

Cuando exista el andamiaje del proyecto, los comandos de referencia serán:

```bash
# Aplicación Next.js
npm install
npm run dev

# Verificación
npm run lint
npm run typecheck
npm test
npm run validate:mock

# Pipeline de datos
python scripts/run.py --from 2015 --to 2025
```

Hoy el `package.json` de la raíz y el entorno Python todavía no existen. No ejecutes estos comandos como si existieran; primero crea el andamiaje si la tarea lo pide.

---

## 12. Archivos que no debes tocar sin pedido explícito

| Archivo | Motivo |
|---|---|
| `docs/*.md` | Solo se editan para reflejar un cambio real de alcance, contrato o decisión |
| `.env` | Contiene secretos; nunca se versiona |
| `MEMORY.md` | Se actualiza de forma deliberada, no automática |

No borres archivos ajenos ni reorganices carpetas sin confirmación.

---

## 13. Verificación rápida

Antes de dar una tarea por terminada, si tocaste documentación o datos:

```powershell
# 1. Tablas Markdown con columnas consistentes
Get-ChildItem .\docs\*.md | ForEach-Object {
  $file = $_.Name; $lines = Get-Content $_.FullName; $block = @(); $start = 0
  for ($i = 0; $i -le $lines.Count; $i++) {
    $line = if ($i -lt $lines.Count) { $lines[$i] } else { '' }
    if ($line -match '^\s*\|') {
      if ($block.Count -eq 0) { $start = $i + 1 }
      $block += $line
    } else {
      if ($block.Count -gt 1) {
        $counts = $block | ForEach-Object { ($_ -split '(?<!\\)\|').Count }
        if (($counts | Sort-Object -Unique).Count -gt 1) {
          Write-Output "$file línea $start : columnas inconsistentes ($($counts -join ','))"
        }
      }
      $block = @()
    }
  }
}

# 2. Bloques JSON válidos en los contratos
$content = Get-Content -Raw '.\docs\04-CONTRATOS-API.md'
[regex]::Matches($content, '(?s)```json\r?\n(.*?)```') | ForEach-Object {
  $_.Groups[1].Value | ConvertFrom-Json | Out-Null
}

# 3. Sin secretos accidentales (debe devolver vacío)
Select-String -Path .\docs\*.md, .\*.md -Pattern 'GAMC_API_KEY\s*=\s*\S+'
```

Si el paso 1 no imprime nada y los pasos 2 y 3 no lanzan error, la documentación está consistente.

---

## 14. Referencias

- Documentación interna: `docs/01-PROYECTO.md` … `docs/06-PLAN-DESARROLLO.md`.
- Documentación GAMC: https://recursosgamc.cochabamba.bo/api-doc
- Endpoint WMS: https://serviciosgamc.cochabamba.bo/api/gs/wms
- Productos NASA: MOD13Q1 y MOD11A2, colección 6.1.
