# MEMORY.md — Memoria del proyecto

Registro vivo de decisiones, estado y pendientes de **GeoQocha**. Sirve para que cualquier persona o agente retome el trabajo sin reconstruir el contexto.

**Cómo mantenerlo**

- Añade una entrada en la bitácora cada vez que cambie una decisión, un contrato o el estado del repositorio.
- No borres decisiones anteriores: si cambian, marca la anterior como reemplazada.
- Las decisiones cerradas se citan por identificador (`D-xx`).
- La documentación detallada sigue en `docs/`; este archivo resume y conecta.

---

## 1. Estado actual

**Fecha de corte:** 13 de noviembre de 2026.

| Aspecto | Estado |
|---|---|
| Documentación | Seis documentos en `docs/`, índice `docs/README.md`, README raíz y LICENSE |
| Marca y alcance | GeoQocha reemplaza a Cochabamba Verde; se incorpora copiloto IA y concientización |
| Stack objetivo | Next.js + TypeScript + Tailwind + Leaflet + Recharts; route handlers para API |
| Código de aplicación | Legado Vite/Express en `frontend/` y `backend/`; migración a Next.js pendiente |
| Contrato compartido | Definido en `docs/06` y `docs/04`; archivos `src/types/geoqocha.ts` y mock pendientes de crear |
| Pipeline de datos | No iniciado |
| Datos procesados | No generados; el mock será ilustrativo |
| Repositorio Git | Inicializado en `main`; ramas `dev` y `feat/*` pendientes |
| Despliegue | No configurado |
| IA | Arquitectura y contrato definidos; proveedor y clave pendientes |
| Validación de fuentes | Pendiente |
| Equipo de desarrollo | 3 personas de sistemas con frentes independientes |

**Conclusión:** la documentación ya refleja el alcance GeoQocha y el plan de tres frentes. El siguiente paso es el Día 0: crear el contrato, el mock y el andamiaje Next.js. Nada de lo descrito como dato medido existe todavía.

---

## 2. Decisiones cerradas

| ID | Decisión | Motivo | Documento |
|---|---|---|---|
| D-01 | ICVSA **histórico** 2015–2025, escala 1–100 | El reto pide una puntuación socioambiental histórica, no solo un índice ambiental | `02` §7.1, `01` §6 |
| D-02 | Pesos 35 % vegetación, 35 % LST, 20 % equipamiento, 10 % movilidad | 70 % del peso sigue la serie NASA; 30 % refleja el territorio | `02` RN-02, RN-03 |
| D-03 | Equipamiento y movilidad fijos en `t_ref` declarado | El GAMC no garantiza series anuales; no se inventan datos | `02` RN-09 |
| D-04 | `index_without_territorial` como análisis de sensibilidad | Permite separar el efecto ambiental del municipal | `02` RN-10, `04` |
| D-05 | Semáforo como **vista alternativa** del mismo índice | El reto acepta 1–100 o colores; no son índices distintos | `02` RN-01, RF-37 |
| D-06 | Estrategia **vector-first** para el GAMC | Los cálculos requieren geometrías; el WMS solo devuelve imágenes | `03` AD-04, `05` §2.1 |
| D-07 | Proxy backend obligatorio para el WMS | Evita exponer la `key` y permite lista blanca | `03` AD-01 |
| D-08 | Archivos JSON/CSV como persistencia del MVP | 15 distritos × 11 años es un volumen pequeño; acelera la entrega | `03` AD-02 |
| D-09 | Seis reglas de hotspot, incluidas déficit de equipamiento y brecha territorial | El reto pide señales ambientales y de equipamiento | `02` RN-11 |
| D-10 | Correlación **exploratoria**, con `n`, sin causalidad; no se calcula si `n < 8` | 15 distritos no permiten inferencia causal robusta | `02` RN-14, RN-20 |
| D-11 | Plan dimensionado solo para **3 desarrolladores de sistemas** (DEV1, DEV2, DEV3) | Los perfiles comercial y de diseño colaboran fuera de este entorno | `06` §1, §5 |
| D-12 | Alcance P0 cerrado; P1 solo con holgura; P2 posterior | Capacidad 144 h y P0 completo consumen las 48 h por persona; no hay margen | `06` §2, §6.4 |
| D-13 | ~~Sin IA generativa~~ **Reemplazada por D-17** | El producto ahora incluye copiloto IA acotado | `03` AD-05 |
| D-14 | Mapas de calor precalculados en el pipeline | Evita recalcular estadísticas en el navegador | `03` AD-07 |
| D-15 | `null` = no disponible; nunca cero; no se interpola | Evita conclusiones falsas por datos imputados | `02` RN-07, RN-23 |
| D-16 | Licencia MIT para código y CC BY 4.0 para documentación | Cumple el requisito de código abierto | `05` §6, `06` §7 |
| D-17 | IA generativa acotada: solo narra hechos precalculados, con citas y fallback | Copiloto útil sin ceder validez metodológica a una caja negra | `03` AD-05, `02` RN-24…RN-27 |
| D-18 | GeoQocha reemplaza a Cochabamba Verde | Nuevo nombre y alcance del producto | `01`, `02`, `03`, `04`, `06` |
| D-19 | Next.js App Router reemplaza Vite + Express en el MVP | Un solo despliegue, tipos compartidos y route handlers | `03` AD-09, `06` §3 |
| D-20 | Contrato y mock congelados antes de abrir ramas | Garantiza independencia total de los tres frentes | `06` §3, `03` AD-10 |
| D-21 | Ramas independientes con carpetas exclusivas y merge a `dev` | Evita conflictos y dependencias cruzadas | `06` §5 y §9 |
| D-22 | Paradas «seguras» se presentan como propuestas ilustrativas hasta validación | No existe fuente oficial de seguridad de paradas | `03` AD-11, `02` RN-28 |

---

## 3. Datos clave del proyecto

### Índice

```text
ICVSA(d,t) = 0.35 * S_NDVI(d,t) + 0.35 * S_LST(d,t)
           + 0.20 * S_EQ(d,t_ref) + 0.10 * S_MOV(d,t_ref)
```

| Elemento | Valor |
|---|---|
| Escala | 1–100 |
| Verde | 70–100 |
| Amarillo | 40–69 |
| Rojo | 1–39 |
| Periodo | 2015–2025 |
| Año de referencia territorial | `territorial_reference_year`, por definir con el GAMC (ejemplo en contratos: 2024) |

### Fuentes

| Fuente | Detalle |
|---|---|
| NDVI | MOD13Q1, colección 6.1, 250 m, 16 días |
| LST | MOD11A2, colección 6.1, 1 km, 8 días, convertida a °C |
| GAMC | 7 servicios WMS 1.1.1 de solo lectura, más GeoJSON de transporte y capas vectoriales |
| IA | Gemini u OpenAI; solo redacta y explica hechos precalculados con citas y fallback |
| Documentación GAMC | https://recursosgamc.cochabamba.bo/api-doc |
| Endpoint WMS | https://serviciosgamc.cochabamba.bo/api/gs/wms |
| Distritos | 15, `district_id` entero 1–15 |

### Límites metodológicos

- La LST de 1 km puede ser demasiado gruesa para distritos pequeños.
- La LST no es temperatura del aire.
- El NDVI es estacional; se compara con ventana equivalente.
- Los datos municipales actuales no son una serie histórica.
- La correlación no implica causalidad.
- El índice no es evaluación oficial del GAMC ni priorización vinculante.

---

## 4. Equipo y capacidad

| Persona | Frente | Dueño de |
|---|---|---|
| DEV1 | Mapas, WMS y movilidad urbana | `src/components/map/`, `src/services/wms/`, `src/app/api/gamc/`, `src/backend/gamc/` |
| DEV2 | Datos NASA, pipeline y backend de IA | `scripts/`, `data/`, `src/backend/data/`, `src/backend/ai/`, `src/app/api/ai-analyst/` |
| DEV3 | Analítica, concientización y chat UI | `src/components/analytics/`, `src/components/awareness/`, `src/components/ai/` |

| Métrica | Valor |
|---|---|
| Capacidad total | ~144 horas-persona (3 × 48 h) |
| Día 0 compartido | 6 h por persona |
| Trabajo autónomo | 6 tareas × 6 h = 36 h por persona |
| Integración y demo | 6 h por persona |
| Implicación | Los tres frentes tienen el mismo peso; cualquier función nueva exige quitar otra del mismo frente |

---

## 5. Prioridades vigentes

### P0 — imprescindible

- T-00: contrato, mock, andamiaje y tag `contract-v0.1.0`.
- DEV1: T1-01…T1-06 (mapa, WMS, capas, transporte, URL y calidad).
- DEV2: T2-01…T2-06 (pipeline, NASA, índice, RAG, endpoint y guardrails).
- DEV3: T3-01…T3-06 (panel, fichas, concientización, chat, diagnóstico y calidad).

### P1 — solo si sobra tiempo dentro del mismo frente

- Capas municipales adicionales y leyendas ampliadas.
- Serie mensual y mapa de calor de severidad.
- Exportación CSV y enlaces compartibles.
- Tarjetas educativas compartibles y más combinaciones de correlación.

### P2 — posterior

- Validación con especialistas, sensibilidad de pesos y población verificada.
- Automatización del pipeline y PostgreSQL/PostGIS.
- Índice RAG persistente y evaluación formal de respuestas.
- Validación oficial de paradas con el GAMC.

---

## 6. Contrato congelado

**Archivo compartido:** `src/types/geoqocha.ts` con `CONTRACT_VERSION = "0.1.0"`.

**Tipos:** `DistrictData`, `DistrictGeometry`, `DistrictSeriesPoint`, `DistrictTrend`, `EquipmentMetrics`, `StopPoint`, `AIRequest`, `AIResponse`, `AIInsight`, `AIEvidence`, `AICitation`, `DataStatus`, `RiskLevel`.

**Endpoints:** `/districts`, `/districts/:id`, `/districts/:id/indicators`, `/comparison`, `/hotspots`, `/heatmap`, `/analysis/correlation`, `/methodology`, `/sources`, `/health`, `/gamc/wms`, `/ai-analyst`.

**Reglas:**

- Unidades en el nombre del campo.
- Error uniforme `{ error: { code, message, details } }`.
- `null` explícito, nunca `0`.
- `territorial_reference_year` e `index_without_territorial` presentes en la serie.
- `data_quality_flag`: `ok`, `partial`, `insufficient`.
- `data_status`: `real`, `illustrative`, `insufficient`.
- `AIResponse` siempre incluye `citations`, `disclaimer` y `fallback_used`.
- La IA no calcula índices ni hotspots; solo explica hechos del contexto.
- Sin cambios de contrato sin actualizar `docs/04-CONTRATOS-API.md` y aprobación de los tres.

---

## 7. Verificación pendiente

Nada de esta lista está confirmado todavía. No lo presentes como hecho.

- [ ] El GeoJSON contiene 15 polígonos con CRS identificable y topología válida.
- [ ] Los `district_id` coinciden entre GeoJSON, NASA y datos municipales.
- [ ] El GAMC entrega vectores de áreas verdes, equipamiento, educación, salud y población.
- [ ] La lista de `service_id` válidos está verificada con `GetMap`.
- [ ] `GetFeatureInfo` devuelve JSON utilizable.
- [ ] Las series NASA cubren 2015–2025 con cobertura aceptable en los 15 distritos.
- [ ] El año de referencia (`t_ref`) de cada fuente municipal está definido.
- [ ] Los términos de uso y licencias del GAMC permiten publicar los datos derivados.
- [ ] El pipeline reproduce los resultados en una máquina limpia.
- [ ] El proveedor de IA está configurado solo en el servidor y el fallback funciona sin clave.
- [ ] Las respuestas de IA citan fuente, campo y año, y no inventan cifras.
- [ ] Las paradas propuestas están etiquetadas como ilustrativas y no como oficiales.

Detalle completo en `docs/05-FUENTES-DATOS.md` §7.

---

## 8. Bitácora

| Fecha | Cambio |
|---|---|
| 2026-11-10 | Versión 1.0 de los seis documentos de `docs/`. |
| 2026-11-13 | Ajuste al enunciado del reto: ICVSA histórico, `t_ref`, mapas de calor, hotspots de equipamiento, correlación exploratoria, vector-first, licencia y UX. |
| 2026-11-13 | Prioridades alineadas al reto: `GetFeatureInfo`, severidad, aceleración, serie mensual y enlaces compartibles reclasificados. |
| 2026-11-13 | `06-PLAN-DESARROLLO.md` reescrito para 3 desarrolladores de sistemas. |
| 2026-11-13 | Creados `AGENTS.md` y `MEMORY.md`. |
| 2026-11-13 | GeoQocha reemplaza a Cochabamba Verde; se agrega copiloto IA con RAG, citas y fallback. |
| 2026-11-13 | Stack del MVP migra a Next.js App Router con route handlers; Vite y Express quedan como legado. |
| 2026-11-13 | Plan reescrito con contrato compartido, mock y tres frentes independientes de igual complejidad. |
| 2026-11-13 | Se declara que las paradas «seguras» son propuestas ilustrativas hasta validación oficial. |
| 2026-11-13 | Se ajusta `06-PLAN-DESARROLLO.md` para cubrir explícitamente todos los elementos esenciales de `02`: comparador, semáforo, mapa de calor LST, brechas, correlaciones y vistas de hotspots, metodología y fuentes; DEV2 queda como dueño de los route handlers de datos. |
| 2026-11-13 | Se agrega en `06-PLAN-DESARROLLO.md` una matriz central de seguimiento para T-00, T1-01…T3-06 e INT-01, con estados, evidencia, criterio de integración y regla de actualización por PR. |
| 2026-11-13 | Se crea `MAESTRO.md` en la raíz como resumen autónomo y compartible del proyecto; no sustituye las fuentes de verdad internas y puede retirarse después de compartirlo. |

---

## 9. Próximos pasos

1. Crear el andamiaje Next.js, Tailwind y route handlers según `03` §2 y AD-09.
2. Crear `src/types/geoqocha.ts`, `src/lib/data-source.ts` y `public/data/mock_distritos.json`.
3. Crear la rama `dev`, mergear `chore/contract-v0.1.0` y etiquetar `contract-v0.1.0`.
4. Abrir las ramas `feat/dev1-map-transport`, `feat/dev2-data-ai` y `feat/dev3-analytics-chat`.
5. Implementar el proxy WMS y el endpoint `/api/ai-analyst` con fallback.
6. Generar el primer `distritos_data.json` con NDVI, LST, índice y metadatos.
7. Integrar mapa, panel, concientización y chat en la composición full-screen.
8. Verificar citas, `fallback_used`, etiquetas de datos ilustrativos y ausencia de secretos.
9. Ejecutar lint, typecheck, tests y validación del mock.
10. Desplegar, documentar y ensayar la demo.

---

## 10. Convenciones de memoria

- Una decisión nueva se agrega como `D-23`, `D-24`, etc.
- Una decisión reemplazada se marca como «reemplazada por D-xx», sin borrar el historial.
- Las tareas se citan con su identificador `T-xx` del plan.
- Los requerimientos se citan como `RF-xx`, `RNF-xx` o `RN-xx`.
- Las fechas usan formato `YYYY-MM-DD`.
