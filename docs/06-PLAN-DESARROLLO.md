# 06 — Plan de desarrollo

Plan de ejecución del MVP en un escenario de **hackathon de 48 horas con 3 desarrolladores de sistemas**, con extensiones para el trabajo posterior al evento.

---

## 1. Supuestos

| Supuesto | Valor |
|---|---|
| Duración | 48 horas continuas (turnos rotativos) |
| Equipo | 3 desarrolladores de sistemas |
| Roles | S1 backend/API, S2 frontend/mapas, S3 datos/GIS |
| Capacidad | ~144 horas-persona; el P0 se estima en ~138 h |
| Alcance | MVP definido en [`02-REQUERIMIENTOS.md`](./02-REQUERIMIENTOS.md#8-alcance-del-mvp) |
| Datos | GeoJSON distrital y capas vectoriales GAMC disponibles; series NASA procesables; WMS accesible |
| Índice | ICVSA histórico con componente territorial fijo en `t_ref` |
| Riesgo principal | Calidad/estructura real de los datos municipal y satelital |

> Con 3 personas no hay holgura para P1. El alcance P0 está cerrado y cualquier función adicional exige quitar otra.

---

## 2. Cronograma por bloques

| Bloque | S1 — Backend/API | S2 — Frontend/mapas | S3 — Datos/GIS | Evidencia |
|---|---|---|---|---|
| **0–6 h** | Contratos, esqueleto Express, proxy base | Shell UI, mapa con datos simulados | Validar GeoJSON, vectores, CRS y `t_ref` | Mapa y fuentes comprobados |
| **6–18 h** | Proxy funcional, `/districts` e `/indicators` | Coropletas, selector de año, ficha con mocks | NDVI/LST y `district_year.json` | Primer dataset + mapa interactivo |
| **18–30 h** | `/comparison`, `/hotspots`, `/heatmap` | Ficha real, comparador, heatmap LST, capas mínimas | ICVSA, equipamiento, movilidad, hotspots | Análisis temporal e índice funcional |
| **30–40 h** | Correlación, brechas, integración | Vista de correlación, responsive, accesibilidad | QA de datos, tendencias y metadatos | MVP estable y entendible |
| **40–48 h** | Deploy, README, LICENSE | Pulido final y flujo de demo | Datos finales y verificación | Demo pública y repositorio abierto |

### Hitos verificables

| Hito | Momento | Criterio de cumplimiento |
|---|---|---|
| H0 — Fuentes validadas | h 6 | 15 distritos cargan; un `service_id` responde; vectores y `t_ref` identificados |
| H1 — Mapa y API base | h 18 | NDVI/LST de al menos un año visibles por distrito; endpoints base estables |
| H2 — Funcionalidad completa | h 30 | ICVSA histórico, comparador, hotspots y heatmap LST navegables |
| H3 — MVP estable | h 40 | Criterios de aceptación esenciales aprobados |
| H4 — Demo lista | h 48 | Despliegue, README, presentación y ensayo |

---

## 3. Roles y responsabilidades

| Persona | Rol | Responsabilidad | Entregables clave |
|---|---|---|---|
| **S1** | Backend, API y despliegue / tech lead | Proxy GAMC, endpoints, caché, integración y deploy | API, contratos, README, demo desplegada |
| **S2** | Frontend, mapas y visualización | Dashboard, fichas, comparador, heatmap y accesibilidad | Mapa, fichas, comparador, vistas de metodología y correlación |
| **S3** | Datos, GIS y NASA | Vectores, series NDVI/LST, ICVSA, equipamiento, hotspots y correlación | `district_year`, `trends`, `equipment_metrics`, `hotspots`, metadatos |

### Matriz de dependencias

```text
S3 Datos/GIS ──> S1 Backend/API ──> S2 Frontend
        │                │                │
        └──── contratos ─┴────────────────┘
                    S1 (tech lead)
```

**Reglas de trabajo:**

- **S1 es tech lead:** decide integración, resuelve bloqueos y mantiene el contrato.
- El contrato de [`04-CONTRATOS-API.md`](./04-CONTRATOS-API.md) se congela antes del bloque 6–18 h.
- Cada frente tiene un dueño único; las revisiones son cruzadas.
- S2 puede avanzar con mocks desde la hora 0; no espera a S1 ni a S3.

---

## 4. Backlog priorizado

### P0 — Imprescindible para la demo

| ID | Tarea | Responsable | Depende de |
|---|---|---|---|
| T-01 | Validar GeoJSON: 15 polígonos, CRS, atributos | S3 | — |
| T-02 | Normalizar `district_id` entre fuentes | S3 | T-01 |
| T-03 | Probar WMS: `GetMap`, leyenda y `GetFeatureInfo` | S1 | — |
| T-04 | Implementar proxy con lista blanca y `.env` | S1 | T-03 |
| T-05 | Procesar NDVI 2015–2025 por distrito | S3 | T-01 |
| T-06 | Procesar LST 2015–2025 por distrito | S3 | T-01 |
| T-07 | Generar `district_year.json` con calidad | S3 | T-05, T-06 |
| T-08 | Endpoints `/districts`, `/indicators`, `/comparison` | S1 | T-07 |
| T-09 | Mapa con coropletas, selector de variable/año y toggle 1–100/semáforo | S2 | T-01, T-08 |
| T-10 | Ficha distrital con series históricas y resumen en lenguaje llano | S2 | T-08 |
| T-11 | Comparador de dos distritos | S2 | T-08 |
| T-12 | Construir el ICVSA histórico y su metodología | S3 | T-07 |
| T-13 | Reglas de hotspots ambientales y de equipamiento | S3 + S1 | T-12 |
| T-14 | Vista de hotspots con explicación | S2 | T-13 |
| T-15 | Vista de metodología y fuentes | S2 | T-12 |
| T-16 | Despliegue, README y LICENSE | S1 | todo |
| T-17 | Activar capas municipales mínimas: áreas verdes y equipamiento | S2 + S1 | T-04 |
| T-21 | Responsive y revisión de accesibilidad | S2 | T-09 |
| T-27 | Validar vectores de áreas verdes, educación, salud y transporte | S3 | T-01 |
| T-28 | Calcular `equipment_access_index` y `mobility_access_index` con `t_ref` | S3 | T-27 |
| T-29 | Integrar ICVSA en `/indicators` y `/comparison` con sensibilidad | S1 | T-12, T-28 |
| T-30 | Mapa de calor de LST | S2 + S3 | T-08 |
| T-31 | Brechas vs promedio municipal en ficha y comparador | S2 + S1 | T-29 |
| T-32 | Endpoint y vista de correlación exploratoria mínima | S3 + S2 | T-28 |

### P1 — Solo si sobra tiempo

| ID | Tarea |
|---|---|
| T-18 | Visualización del GeoJSON de transporte |
| T-19 | Indicadores de cobertura y confianza en la UI |
| T-20 | Exportación CSV |
| T-33 | Capas municipales adicionales: salud, educación, límite urbano y leyendas WMS |
| T-34 | Mapa de calor de severidad |
| T-35 | Serie mensual |
| T-36 | Enlaces compartibles por distrito/año/variable |
| T-37 | Correlación con múltiples combinaciones |

### P2 — Opcional / posterior

| ID | Tarea |
|---|---|
| T-22 | Validación del ICVSA con especialistas y proceso participativo |
| T-23 | Análisis de sensibilidad de pesos |
| T-24 | Población por distrito y tasas |
| T-25 | Automatización del pipeline NASA |
| T-26 | PostgreSQL + PostGIS |
| T-38 | Detección de aceleración por subperiodos (2015–2020 vs. 2020–2025) |

---

## 5. Detalle de tareas críticas

### 5.1 Validación de fuentes (S3, bloque 0–6 h)

1. Abrir el GeoJSON y verificar `FeatureCollection` con 15 elementos.
2. Comprobar campos de identificación y nombres de distrito.
3. Identificar CRS y proyectar a EPSG:4326 para el mapa y a una proyección métrica para áreas.
4. Verificar topología: polígonos cerrados, sin autointersecciones, sin geometrías vacías.
5. Calcular superficies y compararlas con referencias disponibles.
6. Probar cada `service_id` con `GetMap` y registrar los que funcionan.
7. Probar `GetFeatureInfo` en un punto conocido.
8. Descargar el GeoJSON de transporte y revisar campos y cobertura.
9. Revisar los vectores de áreas verdes, educación, salud y equipamiento: campos, fecha, licencia y cobertura.
10. Confirmar el `territorial_reference_year` de cada fuente municipal.

**Criterio de salida:** documento breve con `service_id` válidos, CRS confirmado, vectores utilizables y `t_ref` por fuente.

### 5.2 Procesamiento NASA y datos (S3, bloque 6–30 h)

1. Definir AOI a partir de los distritos validados.
2. Seleccionar MOD13Q1 y MOD11A2, colección 6.1.
3. Aplicar máscaras QA y filtros de nubosidad.
4. Convertir LST a °C con el factor documentado.
5. Agregar por distrito y año; para NDVI usar ventana estacional fija.
6. Registrar conteo de observaciones y fracción de píxeles válidos.
7. Exportar tabla distrito-año con `data_quality_flag`.
8. Calcular pendientes y significancia cuando sea posible.
9. Unir equipamiento y movilidad por distrito con `territorial_reference_year`.
10. Calcular `socioenvironmental_index` e `index_without_territorial`.
11. Generar hotspots, brechas, correlación y celdas de mapa de calor.

**Criterio de salida:** `district_year.json` con 15 distritos × 11 años (con nulos donde corresponda), ICVSA y metadatos.

### 5.3 Proxy y API (S1, bloque 0–30 h)

1. Crear Express con TypeScript y middleware de errores.
2. Implementar `GET /api/gamc/wms` con lista blanca de `service_id`.
3. Implementar lectura de `data/processed` y endpoints de indicadores.
4. Añadir endpoints de comparación, mapa de calor, brechas y correlación.
5. Añadir caché en memoria o en disco para WMS.
6. Añadir `GET /api/health`.
7. Probar con `curl` y con el frontend.

### 5.4 Frontend (S2, bloque 0–40 h)

1. Definir layout, navegación y escala tipográfica.
2. Implementar mapa base, coropletas y selector de año/variable.
3. Implementar semáforo y leyendas accesibles.
4. Construir ficha distrital con series NDVI/LST/ICVSA.
5. Construir comparador y vista de brechas.
6. Construir mapa de calor de LST.
7. Construir vista de hotspots y de correlación.
8. Revisar responsive, teclado y contraste.

### 5.5 Integración y QA (S1 + S2 + S3, bloque 30–48 h)

1. Verificar que cada endpoint devuelve el contrato esperado.
2. Revisar que los nulos se muestren como «no disponible».
3. Validar que ningún dato de ejemplo se presente como real.
4. Comprobar que la clave no aparece en el bundle del frontend.
5. Revisar tiempos de carga y comportamiento sin WMS.
6. Probar en móvil y con navegación por teclado.
7. Verificar que el ICVSA declara `territorial_reference_year` y muestra la sensibilidad.
8. Comprobar que el semáforo no depende solo del color.
9. Revisar que la correlación incluye `n` y advertencia de no causalidad.
10. Confirmar que `LICENSE` y la atribución son visibles.

---

## 6. Definición de terminado (DoD)

Una tarea se considera terminada cuando:

- [ ] Cumple su criterio de aceptación del documento de requerimientos.
- [ ] Está integrada en la rama principal.
- [ ] No expone credenciales ni datos sensibles.
- [ ] Los datos que muestra son reales o están marcados como ilustrativos.
- [ ] Tiene manejo de estados vacíos y de error.
- [ ] Declara `territorial_reference_year` y no inventa datos municipales de años no observados.
- [ ] Cumple la regla de licencia abierta y atribución.
- [ ] Fue revisada por al menos otra de las 3 personas.

---

## 7. Coordinación del equipo

| Práctica | Definición |
|---|---|
| Repositorio | Monorepo con `frontend/`, `backend/`, `data-processing/`, `data/`, `docs/`. |
| Propiedad | S1 backend, S2 frontend, S3 `data-processing` y datos. |
| Tech lead | S1 resuelve bloqueos, integra y autoriza cambios de contrato. |
| Ramas | `main` estable; `feat/*`, `fix/*`, `data/*` para trabajo. |
| Commits | Mensajes descriptivos, en español o inglés consistente. |
| Contratos | Congelados antes del bloque 6–18 h. |
| Sincronización | Checkpoint cada 6 h con demo interna de 5 minutos. |
| Alcance | P0 cerrado; toda función nueva exige quitar otra. |
| Bloqueos | Se reportan de inmediato a S1. |
| Secretos | `.env` local; `.env.example` versionado sin valores reales. |
| Licencia | MIT para código y CC BY 4.0 para documentación, sujeto a los términos de las fuentes. |

### Variables de entorno

```dotenv
PORT=3000
GAMC_WMS_URL=https://serviciosgamc.cochabamba.bo/api/gs/wms
GAMC_API_KEY=
GAMC_ALLOWED_SERVICE_IDS=
CORS_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|---|---|---|---|
| GeoJSON no corresponde a distritos o tiene geometrías inválidas | Bloquea estadísticas NASA por distrito | Media | Validar archivo, propiedades, CRS, cantidad de polígonos y topología desde el inicio |
| WMS solo devuelve mapas, no vectores completos | Limita cálculos de áreas/cobertura | Alta | Solicitar capas vectoriales; WMS para visualización y `GetFeatureInfo` |
| Clave API expuesta | Acceso no autorizado | Media | Proxy backend, variables de entorno, rotación y control de uso |
| Cobertura satelital desigual o píxeles grandes | Comparaciones poco fiables | Alta | QA, indicadores de cobertura y advertencias para distritos pequeños |
| Equipamientos actuales sin serie histórica | El ICVSA no tendría territorio anual | Alta | Fijar `t_ref` declarado, publicar sensibilidad y no interpolar |
| Vectores municipales incompletos | Hotspots de equipamiento y índice parciales | Media | Marcar `insufficient_data`, usar lo verificable y documentar la brecha |
| Correlación leída como causalidad | Conclusiones erróneas | Media | Presentarla como exploratoria, con `n` y advertencia visible |
| Datos demográficos desactualizados | Tasas por habitante engañosas | Media | Indicar año de referencia, fuente y supuestos |
| Capacidad justa: ~138 h de P0 sobre 144 h | Poca holgura para imprevistos | Alta | P1 cerrado; recortar primero heatmap de severidad y capas adicionales |
| Dependencia de una sola persona por frente | Bloqueo si alguien se ausenta | Media | README por frente y revisión cruzada obligatoria |
| Tiempo limitado de hackathon | MVP incompleto | Alta | Priorizar mapa + series NASA + ICVSA + comparador |
| Restricciones de licencia de datos municipales | Publicación no autorizada | Media | Confirmar términos de GAMC; publicar solo lo permitido |
| Servicio municipal caído durante la demo | Capas no visibles | Media | Caché de tiles y modo degradado con aviso |

### Plan de contingencia

1. **Sin GeoJSON distrital válido:** usar límites aproximados solo para demo, marcados como no oficiales, y priorizar la corrección del archivo.
2. **Sin series NASA completas:** publicar los años disponibles y mostrar explícitamente la cobertura.
3. **Sin WMS en la demo:** mostrar capturas cacheadas o capas estáticas con nota de indisponibilidad.
4. **Sin datos de equipamiento:** publicar `index_without_territorial` como índice ambiental y marcar el ICVSA completo como `insufficient_data`, sin inventar la dimensión faltante.
5. **Retraso en un frente:** S1 reasigna; se recorta P1 antes de tocar P0.

---

## 9. Entregables

- Aplicación web pública o demostrable.
- Código abierto con licencia (`LICENSE`) y estructura documentada.
- Integración de vectores y WMS del GAMC, con capas mínimas de áreas verdes y equipamiento.
- Datos de indicadores NASA procesados y trazables.
- Mapa distrital interactivo con selección, capas y mapa de calor de LST.
- Análisis de tendencias ambientales y comparador.
- **ICVSA histórico** documentado con `t_ref` y sensibilidad.
- Detección de hotspots ambientales y de déficit de equipamiento.
- Análisis exploratorio de relación ambiente ↔ equipamiento/transporte.
- README, manual básico de uso, instrucciones de despliegue y atribución de fuentes.

---

## 10. Guion de demo (5 minutos)

**Reparto:** S1 conduce y explica arquitectura; S2 muestra la interfaz; S3 respalda datos y metodología.

| Minuto | Acción |
|---|---|
| 0:00–0:40 | Problema: información dispersa sobre 15 distritos; propuesta de valor. |
| 0:40–1:40 | Dashboard: ICVSA, cambio de año, semáforo y mapa de calor de LST. |
| 1:40–2:40 | Ficha distrital: series NDVI/LST/ICVSA, tendencia y calidad de datos. |
| 2:40–3:20 | Capas municipales: áreas verdes y equipamiento. |
| 3:20–4:00 | Comparador: dos distritos, brechas vs promedio y explicación. |
| 4:00–4:30 | Hotspots: reglas ambientales y de equipamiento; análisis de relación. |
| 4:30–5:00 | Metodología abierta, `t_ref`, licencia, fuentes y cierre. |

---

## 11. Después del hackathon

| Fase | Objetivo |
|---|---|
| Corto plazo | Corregir deuda técnica, completar metadatos, validar el ICVSA con especialistas. |
| Medio plazo | Incorporar más capas y población; migrar a PostgreSQL + PostGIS. |
| Largo plazo | Automatizar el pipeline, publicar API abierta y ampliar a otras ciudades. |

### Deuda técnica esperada

- Caché en memoria volátil.
- Datos servidos desde archivos sin base de datos.
- Cobertura de pruebas limitada.
- Accesibilidad y responsive parciales.
- Capas municipales adicionales y serie mensual pendientes.
- Índice pendiente de validación estadística y participativa.

---

## 12. Checklist final de entrega

- [ ] 15 distritos con geometría verificada.
- [ ] NDVI y LST con serie 2015–2025 y metadatos de calidad.
- [ ] Capas mínimas de áreas verdes y equipamiento, y WMS por proxy seguro.
- [ ] Ficha, selector de año y comparador funcionando.
- [ ] ICVSA histórico con pesos, `t_ref`, normalización, sensibilidad y datos faltantes.
- [ ] Toggle 1–100 / semáforo verde-amarillo-rojo.
- [ ] Mapa de calor de LST.
- [ ] Hotspots con reglas ambientales y de equipamiento, y advertencia visible.
- [ ] Brechas vs promedio municipal en la comparación.
- [ ] Correlación exploratoria con `n` y advertencia de no causalidad.
- [ ] Código sin credenciales; `.env.example` y `LICENSE` presentes.
- [ ] README con despliegue, uso y atribución de fuentes.
- [ ] Datos de ejemplo etiquetados como ficticios.
- [ ] Demo ensayada y despliegue accesible.
- [ ] Repositorio abierto y enlazado desde la presentación.
