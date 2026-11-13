# MEMORY.md — Memoria del proyecto

Registro vivo de decisiones, estado y pendientes de **Cochabamba Verde**. Sirve para que cualquier persona o agente retome el trabajo sin reconstruir el contexto.

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
| Código de aplicación | Landing page inicial creada en `frontend/`; backend mantiene `/api/health` |
| Pipeline de datos | No iniciado |
| Datos procesados | No generados |
| Repositorio Git | No inicializado |
| Despliegue | No configurado |
| Validación de fuentes | Pendiente |
| Equipo de desarrollo | 3 personas de sistemas |

**Conclusión:** el proyecto está listo para iniciar el andamiaje técnico. Nada de lo descrito como dato medido existe todavía.

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
| D-11 | Plan dimensionado solo para **3 desarrolladores de sistemas** (S1, S2, S3) | Los perfiles comercial y de diseño colaboran fuera de este entorno | `06` §1, §3 |
| D-12 | Alcance P0 cerrado; P1 solo con holgura; P2 posterior | Capacidad ~144 h y P0 ~138 h no dejan margen | `06` §4 |
| D-13 | Sin IA generativa | Transparencia y reproducibilidad en 48 horas | `03` AD-05 |
| D-14 | Mapas de calor precalculados en el pipeline | Evita recalcular estadísticas en el navegador | `03` AD-07 |
| D-15 | `null` = no disponible; nunca cero; no se interpola | Evita conclusiones falsas por datos imputados | `02` RN-07, RN-23 |
| D-16 | Licencia MIT para código y CC BY 4.0 para documentación | Cumple el requisito de código abierto | `05` §6, `06` §7 |

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
| S1 | Backend, API y despliegue / tech lead | `backend/`, contratos, integración, deploy |
| S2 | Frontend, mapas y visualización | `frontend/` |
| S3 | Datos, GIS y NASA | `data-processing/`, `data/` |

| Métrica | Valor |
|---|---|
| Capacidad total | ~144 horas-persona (3 × 48 h) |
| P0 estimado | ~138 h |
| Margen | ~6 h |
| Implicación | P1 cerrado; cualquier función nueva exige quitar otra |

---

## 5. Prioridades vigentes

### P0 — imprescindible

T-01…T-17, T-21, T-27…T-32.

Incluye: validación de fuentes, proxy, NDVI/LST, `district_year.json`, ICVSA histórico, equipamiento y movilidad, API, mapa, ficha, comparador, brechas, hotspots, mapa de calor de LST, correlación mínima, metodología, responsive y despliegue.

### P1 — solo si sobra tiempo

T-18…T-20, T-33…T-37.

Incluye: transporte, cobertura y confianza, CSV, capas adicionales, mapa de calor de severidad, serie mensual, enlaces compartibles y correlación ampliada.

### P2 — posterior

T-22…T-26, T-38.

Incluye: validación con especialistas, sensibilidad de pesos, población y tasas, automatización, PostgreSQL/PostGIS y detección de aceleración.

---

## 6. Contrato congelado

**Tipos:** `DistrictYearRecord`, `EquipmentMetrics`, `Trend`, `CorrelationResult`, `Hotspot`.

**Endpoints:** `/districts`, `/districts/:id`, `/districts/:id/indicators`, `/comparison`, `/hotspots`, `/heatmap`, `/analysis/correlation`, `/methodology`, `/sources`, `/health`, `/gamc/wms`.

**Reglas:**

- Unidades en el nombre del campo.
- Error uniforme `{ error: { code, message, details } }`.
- `null` explícito, nunca `0`.
- `territorial_reference_year` e `index_without_territorial` presentes en la serie.
- `data_quality_flag`: `ok`, `partial`, `insufficient`.
- Sin cambios de contrato sin actualizar `docs/04-CONTRATOS-API.md`.

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

---

## 9. Próximos pasos

1. Inicializar el repositorio Git y el `.gitignore` (incluir `.env`, `node_modules`, datos crudos).
2. Crear el andamiaje `frontend/`, `backend/` y `data-processing/` según `03` §4.
3. Validar el GeoJSON y los vectores del GAMC; registrar `t_ref` por fuente.
4. Congelar el contrato de `04` antes del bloque 6–18 h.
5. Implementar el proxy y el endpoint `/api/health`.
6. Generar la primera tabla `district_year.json` con NDVI y LST.
7. Construir el mapa y la ficha con datos reales.
8. Calcular el ICVSA y verificar `index_without_territorial`.
9. Añadir hotspots, brechas, mapa de calor de LST y correlación mínima.
10. Desplegar, documentar y ensayar la demo.

---

## 10. Convenciones de memoria

- Una decisión nueva se agrega como `D-17`, `D-18`, etc.
- Una decisión reemplazada se marca como «reemplazada por D-xx», sin borrar el historial.
- Las tareas se citan con su identificador `T-xx` del plan.
- Los requerimientos se citan como `RF-xx`, `RNF-xx` o `RN-xx`.
- Las fechas usan formato `YYYY-MM-DD`.
