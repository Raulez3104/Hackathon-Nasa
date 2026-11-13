# 02 — Requerimientos

Especificación de requerimientos del MVP **Cochabamba Verde**.

**Convenciones de identificadores**

- `RF-xx` — Requerimiento funcional.
- `RNF-xx` — Requerimiento no funcional.
- `RN-xx` — Regla de negocio o metodológica.
- Prioridad: **M** (Must, esencial), **S** (Should, deseable), **C** (Could, opcional).

---

## 1. Requerimientos funcionales

### 1.1 Módulo 1 — Dashboard general

| ID | Requerimiento | Prioridad | Criterio de aceptación |
|---|---|---:|---|
| RF-01 | Visualizar un mapa interactivo de Cochabamba con los **15 distritos municipales**. | M | El mapa carga las 15 geometrías validadas desde el backend. |
| RF-02 | Colorear los distritos según el índice, NDVI, LST o nivel de prioridad. | M | Al cambiar de variable, la leyenda y los colores se actualizan sin recargar la página. |
| RF-03 | Permitir seleccionar un distrito en el mapa y en un listado. | M | La selección resalta la geometría y muestra un resumen del distrito. |
| RF-04 | Permitir seleccionar el año de análisis dentro del periodo disponible. | M | Solo se ofrecen años con datos; el mapa refleja el año elegido. |
| RF-05 | Permitir seleccionar la variable visualizada (NDVI, LST, índice, prioridad). | M | El selector lista únicamente variables con datos disponibles. |
| RF-06 | Mostrar indicadores generales agregados. | S | Se presentan promedio, mínimo, máximo y conteo de distritos por categoría. |
| RF-07 | Mostrar un ranking distrital ordenable. | S | El usuario puede ordenar ascendente/descendente por la variable activa. |
| RF-08 | Mostrar leyenda y explicación de la escala. | M | Cada variable incluye unidades, rango y significado de los colores. |

### 1.2 Módulo 2 — Ficha y análisis histórico distrital

| ID | Requerimiento | Prioridad | Criterio de aceptación |
|---|---|---:|---|
| RF-09 | Mostrar nombre e identificación territorial del distrito. | M | Se muestran `district_id`, nombre y superficie calculada. |
| RF-10 | Graficar NDVI y LST anuales de **2015 a 2025**. | M | La gráfica muestra un punto por año disponible y marca los años sin datos. |
| RF-11 | Graficar la evolución anual del **ICVSA** (1–100) por distrito entre 2015 y 2025. | M | La serie se muestra junto a NDVI/LST y declara el año de referencia del componente territorial. |
| RF-12 | Mostrar población, áreas verdes, educación y salud **solo si son calculables**. | S | Los campos sin dato se muestran como «no disponible», nunca como cero. |
| RF-13 | Mostrar fuente, fecha de referencia, metodología y notas de calidad. | M | Cada indicador enlaza a su ficha de metadatos. |
| RF-14 | Mostrar métricas de calidad de datos satelitales. | M | Se indica conteo de observaciones válidas, fracción de píxeles válidos y cobertura. |
| RF-15 | Mostrar la tendencia (pendiente) y su interpretación. | M | Se indica dirección, magnitud y advertencia de significancia/limitaciones. |

### 1.3 Módulo 3 — Equipamiento urbano y movilidad

| ID | Requerimiento | Prioridad | Criterio de aceptación |
|---|---|---:|---|
| RF-16 | Activar/desactivar capas municipales del GAMC sobre el mapa. | M | Las capas se solicitan al proxy propio; nunca se exponen credenciales en el cliente. |
| RF-17 | Consultar atributos de entidades al hacer clic (`GetFeatureInfo`). | S | El clic devuelve los atributos disponibles o un mensaje de «sin elementos». |
| RF-18 | Visualizar las rutas de transporte desde GeoJSON. | S | Si el GeoJSON es válido, se dibujan las líneas y se muestra su identificador. |
| RF-19 | Calcular indicadores de proximidad/cobertura de transporte. | C | Solo se publican si existen geometrías y una metodología validada. |
| RF-20 | Mostrar leyendas de las capas WMS. | S | Cada capa activa puede mostrar su leyenda oficial. |

### 1.4 Módulo 4 — Comparación entre distritos

| ID | Requerimiento | Prioridad | Criterio de aceptación |
|---|---|---:|---|
| RF-21 | Seleccionar dos distritos para comparar. | M | La vista muestra ambos distritos en paralelo. |
| RF-22 | Comparar índices y variables lado a lado. | M | Se muestran valores, diferencias absolutas y relativas. |
| RF-23 | Superponer ambas series históricas en el mismo eje temporal. | M | Ambas series comparten escala y eje; se distinguen por color y etiqueta. |
| RF-24 | Mostrar alertas contextualizadas de diferencias relevantes. | S | Cada alerta indica la variable y el umbral que la activó. |
| RF-25 | Exportar la comparación en CSV. | C | El archivo incluye distritos, años, variables, unidades y fuente. |

### 1.5 Módulo 5 — Hotspots y distritos prioritarios

| ID | Requerimiento | Prioridad | Criterio de aceptación |
|---|---|---:|---|
| RF-26 | Clasificar distritos por tendencia de NDVI y LST. | M | La clasificación usa pendientes históricas y umbrales declarados. |
| RF-27 | Identificar indicadores desfavorables con reglas explícitas. | M | Cada distrito marcado lista las reglas que activó. |
| RF-28 | Generar un ranking de distritos que ameriten análisis adicional. | S | El ranking es reproducible a partir de los datos publicados. |
| RF-29 | Explicar los factores que contribuyen al resultado. | M | Se muestra la contribución de cada variable al puntaje. |
| RF-30 | Advertir que la clasificación no es una evaluación oficial ni una priorización de inversión. | M | La advertencia es visible en la vista y en la exportación. |

### 1.6 Módulo 6 — Transparencia y documentación en producto

| ID | Requerimiento | Prioridad | Criterio de aceptación |
|---|---|---:|---|
| RF-31 | Publicar la metodología del índice dentro de la aplicación. | M | Existe una vista con fórmula, pesos, normalización y datos faltantes. |
| RF-32 | Publicar el catálogo de fuentes y sus licencias. | M | Cada dataset enlaza a su origen y condiciones de uso. |
| RF-33 | Distinguir datos reales de ejemplos ilustrativos. | M | Todo dato ficticio está etiquetado como tal en la interfaz. |
| RF-34 | Mostrar la fecha de última actualización de los datos. | S | Visible en el pie de página y en las fichas. |
| RF-35 | Ofrecer una vista de estado del sistema. | C | Endpoint `/api/health` y mensaje de disponibilidad en la UI. |

### 1.7 Módulo 7 — Requisitos explícitos del reto

Estos requerimientos amplían los módulos anteriores para cubrir literalmente el enunciado del desafío.

| ID | Requerimiento | Prioridad | Criterio de aceptación |
|---|---|---:|---|
| RF-36 | Calcular y exponer un **ICVSA histórico anual** por distrito (1–100) combinando NDVI, LST, equipamiento y movilidad. | M | Existe un valor por distrito y año; la respuesta incluye `territorial_reference_year`. |
| RF-37 | Alternar la visualización del índice entre escala **1–100** y **semaforización** verde/amarillo/rojo. | M | El toggle cambia mapa, fichas y leyenda sin alterar los datos. |
| RF-38 | Mostrar un **mapa de calor de LST** para identificar islas de calor urbanas. | M | El mapa representa la intensidad térmica por distrito o por píxel y tiene leyenda en °C. |
| RF-39 | Mostrar un **mapa de calor de severidad** de hotspots. | C | Los distritos se colorean por severidad agregada y se explica su composición. |
| RF-40 | Detectar **aceleración** del cambio ambiental comparando subperiodos. | C | Se compara la pendiente 2015–2020 con 2020–2025 y se marca «aceleración» cuando corresponda. |
| RF-41 | Analizar la **relación** entre tendencia ambiental y acceso a equipamiento/transporte. | M | Se ofrece dispersión, coeficiente y lectura textual sin afirmar causalidad. |
| RF-42 | Calcular **brechas territoriales** frente al promedio municipal. | M | Cada distrito muestra diferencia absoluta y porcentual respecto de la ciudad. |
| RF-43 | Marcar hotspots por **déficit de equipamiento**. | M | Se aplica una regla explícita de equipamiento por habitante o accesibilidad bajo umbral. |
| RF-44 | Generar **enlaces compartibles** que preserven distrito, año y variable. | C | Al abrir el enlace se restaura exactamente la vista. |
| RF-45 | Mostrar un **resumen en lenguaje llano** por distrito. | M | Un párrafo generado por reglas explica el estado y la tendencia sin jerga. |
| RF-46 | Ofrecer serie **mensual** además de la anual cuando la calidad lo permita. | C | La vista mensual suaviza estacionalidad y se etiqueta como complementaria. |
| RF-47 | Publicar el proyecto con **licencia de código abierto** explícita. | M | Existe `LICENSE` y la licencia se muestra en README y pie de la app. |

---

## 2. Requerimientos no funcionales

| ID | Categoría | Requerimiento | Prioridad |
|---|---|---|---:|
| RNF-01 | Seguridad | Las credenciales del GAMC se almacenan únicamente en variables de entorno del backend; nunca en el repositorio, el frontend ni la documentación. | M |
| RNF-02 | Seguridad | Todo acceso al GAMC pasa por un proxy propio con lista blanca de `service_id` y operaciones permitidas. | M |
| RNF-03 | Seguridad | Validar y limitar parámetros (`BBOX`, `WIDTH`, `HEIGHT`, `FORMAT`) para evitar abuso del servicio municipal. | M |
| RNF-04 | Privacidad | No se recopilan datos personales ni se requiere autenticación. | M |
| RNF-05 | Rendimiento | El dashboard debe renderizar el mapa y los indicadores en menos de 3 s en conexión razonable. | S |
| RNF-06 | Rendimiento | Las respuestas de indicadores se sirven desde archivos procesados o caché, no recalculando en cada request. | M |
| RNF-07 | Disponibilidad | El MVP debe funcionar con datos estáticos si el WMS del GAMC no responde. | M |
| RNF-08 | Usabilidad | La interfaz debe ser comprensible para público no técnico; sin jerga sin explicar. | M |
| RNF-09 | Accesibilidad | Contraste suficiente, navegación por teclado y textos alternativos en mapas y gráficos. | M |
| RNF-10 | Responsive | La vista debe ser usable en escritorio y móvil. | M |
| RNF-11 | Mantenibilidad | TypeScript en frontend y backend; linting y formato consistentes. | M |
| RNF-12 | Reproducibilidad | El procesamiento NASA debe documentar filtros, escalas y fuentes para poder repetirse. | M |
| RNF-13 | Trazabilidad | Cada indicador debe poder rastrearse hasta su dataset y año de referencia. | M |
| RNF-14 | Legal | Respetar los términos de uso del GAMC y la atribución de NASA; publicar solo lo permitido. | M |
| RNF-15 | Internacionalización | Interfaz en español, con estructura preparada para otros idiomas. | C |
| RNF-16 | UX ciudadana | Cada indicador incluye una explicación breve en lenguaje llano y una interpretación de qué implica. | M |
| RNF-17 | Accesibilidad visual | Las escalas de color deben ser distinguibles para daltonismo; el semáforo no depende solo del color. | M |
| RNF-18 | Compartibilidad | Las vistas principales deben tener URL propia y metadatos para previsualización. | C |
| RNF-19 | Licencia abierta | Código con licencia OSI (p. ej. MIT); documentación y datos propios con licencia abierta explícita. | M |
| RNF-20 | Desempeño de mapas de calor | El mapa de calor debe renderizar en menos de 2 s con datos anuales precalculados. | S |

---

## 3. Requerimientos de datos

| ID | Requerimiento | Prioridad |
|---|---|---:|
| RD-01 | GeoJSON de distritos con 15 polígonos e identificadores inequívocos, en CRS documentado. | M |
| RD-02 | Serie NDVI por distrito-año (2015–2025) con media, conteo de observaciones válidas y cobertura. | M |
| RD-03 | Serie LST por distrito-año con media en °C, fracción de píxeles válidos y cobertura. | M |
| RD-04 | Capas municipales accesibles vía WMS para visualización. | M |
| RD-05 | GeoJSON de líneas de transporte verificado (estructura, campos, fecha). | M |
| RD-06 | Datos de población agregables por distrito y su año de referencia. | S |
| RD-07 | Metadatos por dataset: origen, fecha, licencia, transformaciones y limitaciones. | M |
| RD-08 | Capas **vectoriales** del GAMC (distritos, áreas verdes, equipamiento, educación, salud) como fuente primaria para conteos y accesibilidad. | M |
| RD-09 | Serie mensual o anual estable de NDVI y LST, sin huecos estacionales que distorsionen la tendencia. | S |
| RD-10 | Valores de equipamiento y movilidad con año de referencia (`territorial_reference_year`) documentado. | M |

### Diccionario mínimo de campos (distrito-año)

| Campo | Tipo | Unidad | Descripción |
|---|---|---|---|
| `district_id` | entero | — | Identificador del distrito (1–15). |
| `year` | entero | año | Año calendario del registro. |
| `ndvi_mean` | número \| null | índice (−1 a 1) | NDVI medio agregado en el distrito. |
| `ndvi_valid_observation_count` | entero | conteo | Observaciones válidas utilizadas. |
| `ndvi_valid_pixel_fraction` | número \| null | 0–1 | Fracción de píxeles válidos. |
| `lst_mean_celsius` | número \| null | °C | LST media; no es temperatura del aire. |
| `lst_valid_pixel_fraction` | número \| null | 0–1 | Fracción de píxeles válidos. |
| `environmental_index` | número \| null | 1–100 | Índice ambiental NDVI+LST del año. |
| `socioenvironmental_index` | número \| null | 1–100 | ICVSA del año (componente territorial fijo en `t_ref`). |
| `index_without_territorial` | número \| null | 1–100 | ICVSA calculado solo con NDVI + LST (sensibilidad). |
| `territorial_reference_year` | entero | año | Año de referencia de equipamiento y movilidad. |
| `equipment_access_index` | número \| null | 0–100 | Acceso relativo a parques, salud y educación. |
| `mobility_access_index` | número \| null | 0–100 | Cobertura o proximidad a transporte público. |
| `trend_acceleration` | número \| null | índice/año² | Diferencia de pendientes entre subperiodos. |
| `data_quality_flag` | enum | — | `ok` \| `partial` \| `insufficient`. |

> Valores de ejemplo son ficticios y sirven solo para definir interfaces.

---

## 4. Requerimientos de integración

| ID | Requerimiento | Prioridad |
|---|---|---:|
| RI-01 | Integrar el WMS del GAMC mediante proxy backend con `key` en servidor. | M |
| RI-02 | Soportar `GetMap` (PNG) para las capas municipales. | M |
| RI-03 | Soportar `GetLegendGraphic` para leyendas. | S |
| RI-04 | Consumir productos NASA MOD13Q1 (NDVI) y MOD11A2 (LST), colección 6.1. | M |
| RI-05 | Permitir actualizar los datos procesados sin cambiar el frontend. | M |
| RI-06 | Exponer una API propia estable y documentada. | M |
| RI-07 | Soportar `GetFeatureInfo` (JSON) para consulta puntual de atributos. | S |

---

## 5. Requerimientos de interfaz

| Vista | Elementos mínimos |
|---|---|
| Dashboard | Mapa, mapa de calor de LST, selector de variable, selector de año, toggle índice/semáforo, leyenda, ranking, resumen agregado. |
| Ficha distrital | Identificación, series NDVI/LST/ICVSA, tendencia, brecha, calidad de datos, fuentes, capas de contexto. |
| Comparación | Dos o más selectores, tabla comparativa, gráfico superpuesto, brechas vs promedio y alertas explicadas. |
| Hotspots | Lista/ranking, reglas activadas (ambiente y equipamiento), contribución por variable, advertencia metodológica. |
| Análisis de relación | Dispersión tendencia ambiental vs acceso, coeficiente, n y lectura sin causalidad. |
| Metodología | Fórmula, pesos, `t_ref`, normalización, datos faltantes, limitaciones, enlaces a fuentes. |

---

## 6. Historias de usuario (priorizadas)

| ID | Historia | Prioridad |
|---|---|---:|
| HU-01 | Como ciudadano quiero ver mi distrito en un mapa y entender su estado sin conocimientos técnicos. | M |
| HU-02 | Como planificador quiero comparar dos distritos para identificar brechas. | M |
| HU-03 | Como investigador quiero descargar/consultar la serie histórica con metadatos. | S |
| HU-04 | Como funcionario quiero ver qué distritos requieren análisis adicional y por qué. | M |
| HU-05 | Como periodista quiero citar la fuente y la metodología de un dato. | S |
| HU-06 | Como organización comunitaria quiero activar capas de equipamiento como contexto. | S |
| HU-07 | Como ciudadano quiero entender el resultado de mi distrito con un semáforo y una frase clara. | M |
| HU-08 | Como planificador quiero explorar si las tendencias ambientales coinciden con déficits de equipamiento o transporte. | S |

### Criterios de aceptación de ejemplo (HU-02)

```gherkin
Escenario: Comparar dos distritos
  Dado que estoy en el módulo de comparación
  Cuando selecciono el distrito 3 y el distrito 9 para 2025
  Entonces veo ambos valores de NDVI, LST e índice lado a lado
  Y veo la diferencia absoluta y relativa entre ellos
  Y veo la fuente y la fecha de referencia de cada valor
  Y si un valor no existe, se muestra "no disponible" y no cero
```

---

## 7. Reglas de negocio y metodología

### 7.1 Índice de Calidad de Vida Socio-Ambiental (ICVSA)

**RN-01.** Escala final de 1 a 100, con vista alternativa semaforizada (verde 70–100, amarillo 40–69, rojo 1–39).

**RN-02.** Fórmula del ICVSA:

\[
ICVSA_{d,t} = 0{,}35\,S^{NDVI}_{d,t} + 0{,}35\,S^{LST}_{d,t} + 0{,}20\,S^{EQ}_{d,t_{ref}} + 0{,}10\,S^{MOV}_{d,t_{ref}}
\]

**RN-03.** Pesos iniciales: Vegetación 35 %, Temperatura superficial 35 %, Equipamiento urbano 20 %, Movilidad 10 %.

**RN-04.** Los rangos de normalización deben ser fijos dentro del periodo de comparación o referencias externas justificadas.

**RN-05.** Documentar la dirección de cada indicador (si «más» es mejor o peor). La LST se invierte para que menor exposición térmica puntúe mejor.

**RN-06.** Evitar comparaciones engañosas por población o superficie; preferir accesibilidad o tasas cuando sea válido.

**RN-07.** Los datos faltantes nunca se tratan automáticamente como cero. Se excluyen del cálculo y se informa la cobertura.

**RN-08.** Separar **nivel**, **tendencia** y **brecha**: el ICVSA de un año, su pendiente histórica y su diferencia frente al promedio municipal son resultados distintos.

**RN-09.** **Construcción histórica:** las dimensiones ambientales varían cada año; equipamiento y movilidad se mantienen en `t_ref` y se declaran en la interfaz. No se interpolan ni extrapolan valores municipales. Si el GAMC entrega series históricas, `t_ref` puede actualizarse por año.

**RN-10.** Publicar pesos, `t_ref`, fuentes y análisis de sensibilidad, incluido `index_without_territorial`. El índice no se presenta como evaluación oficial del GAMC ni como priorización vinculante de inversión.

### 7.2 Clasificación visual provisional

| Rango | Categoría | Color |
|---|---|---|
| 70–100 | Condición relativa favorable | Verde |
| 40–69 | Condición intermedia | Amarillo |
| 1–39 | Condición de atención | Rojo |

Rangos ilustrativos, sujetos a validación.

### 7.3 Reglas de hotspots (explicables)

**RN-11.** Un distrito se marca si cumple al menos una regla:

1. Tendencia de NDVI negativa más allá del umbral acordado.
2. Tendencia de LST positiva más allá del umbral acordado.
3. ICVSA por debajo del percentil bajo definido.
4. Cobertura de datos insuficiente para afirmar una tendencia (señal de estudio, no de deterioro).
5. **Déficit de equipamiento:** equipamiento por 1.000 habitantes o accesibilidad a parques, salud, educación o transporte por debajo del umbral/percentil definido.
6. **Brecha territorial:** ICVSA inferior al promedio municipal por más de la diferencia declarada.

**RN-12.** Cada marca debe listar la regla, la variable y el valor que la activó.

**RN-13.** Las señales de datos insuficientes se distinguen visualmente de las señales de deterioro.

**RN-14.** Las correlaciones se presentan como **exploratorias**. No se infiere causalidad entre cambios ambientales, equipamiento y transporte a partir de coeficientes simples.

### 7.4 Calidad y estacionalidad

**RN-15.** Filtrar observaciones de baja calidad, nubes y valores no válidos mediante bandas QA.

**RN-16.** Comparar años en ventanas estacionales equivalentes para NDVI.

**RN-17.** Advertir cuando la resolución de LST (1 km) sea demasiado gruesa para distritos pequeños.

### 7.5 Aceleración, brechas y análisis de relación

**RN-18.** **Aceleración (opcional):** si se implementa, comparar la pendiente de 2015–2020 con la de 2020–2025. Si la segunda es más desfavorable y supera el umbral, marcar «aceleración» y mostrarlo como señal de atención.

**RN-19.** **Brecha territorial:** calcular `ICVSA` del distrito menos promedio municipal del año, en puntos y en porcentaje. Una brecha negativa indica desventaja relativa, no una causa.

**RN-20.** **Análisis de relación:** permitir dispersión entre tendencia ambiental (NDVI o LST) y acceso a equipamiento/transporte, con coeficiente y n. No calcular si `n < 8` distritos; en ese caso, mostrar solo la tabla.

**RN-21.** **Semáforo:** la clase verde/amarillo/rojo debe acompañarse de texto e ícono, no depender solo del color.

**RN-22.** **Serie mensual:** si se publica, debe agregarse a partir de las observaciones válidas del mes y no reemplaza la serie anual oficial.

**RN-23.** **Dimensión faltante:** si falta por completo equipamiento o movilidad, no se renormalizan los pesos silenciosamente. Se publica `index_without_territorial` y el ICVSA completo se marca `insufficient_data`.

---

## 8. Alcance del MVP

### Esencial

- Mapa de los 15 distritos con geometría verificada.
- Al menos dos variables satelitales NASA: NDVI y LST.
- Tendencias anuales o estacionales comparables de 2015–2025.
- Integración de al menos una capa municipal utilizable, idealmente varias.
- Ficha de distrito, selector de año y comparador.
- ICVSA histórico 2015–2025 con `t_ref`, análisis de sensibilidad y toggle de semáforo.
- Mapa de calor de **LST** para islas de calor urbanas.
- Reglas explicables para hotspots ambientales y de déficit de equipamiento.
- Análisis exploratorio de relación entre tendencia ambiental y acceso a equipamiento/transporte.
- Comparación de brechas frente al promedio municipal.
- Licencia de código abierto, código fuente, documentación y referencia de datos.

### Deseable

- Mapa de calor de **severidad** de hotspots.
- Detección de **aceleración** del cambio ambiental por subperiodos.
- Serie **mensual** complementaria a la anual.
- Enlaces compartibles por distrito, año y variable.
- Capas municipales adicionales, rutas de transporte, población y tasas territoriales verificadas.
- Exportación CSV de resultados.
- Indicadores de confianza y porcentaje de datos válidos.
- Vista móvil accesible.

### Fuera del alcance inicial

- Autenticación y gestión de cuentas.
- Edición de los datos oficiales del GAMC.
- Predicciones complejas con IA.
- Chatbot conversacional.
- Cálculo de rutas óptimas o tráfico en tiempo real.
- Recomendaciones automáticas vinculantes de inversión pública.

---

## 9. Criterios de aceptación del MVP

- [ ] El GeoJSON distrital se abre correctamente y representa **15 distritos** con identificadores inequívocos.
- [ ] El WMS del GAMC se representa en Leaflet a través del método aprobado, sin exponer credenciales.
- [ ] El GeoJSON de transporte se visualiza si sus datos están disponibles y son válidos.
- [ ] Existen registros NASA verificables para NDVI y LST, con año, distrito y fuente.
- [ ] El proceso satelital documenta escalas, unidades, filtros QA y cobertura válida.
- [ ] Se puede seleccionar distrito y comparar dos o más años.
- [ ] Se puede comparar al menos dos distritos.
- [ ] El índice tiene fórmula, pesos, normalización y reglas de datos faltantes públicas.
- [ ] Existe una serie **histórica** de ICVSA por distrito con `territorial_reference_year` declarado.
- [ ] La vista permite alternar entre escala 1–100 y semáforo verde/amarillo/rojo.
- [ ] El mapa de calor de LST identifica islas de calor con leyenda en °C.
- [ ] Los hotspots explican qué indicadores activaron cada alerta, incluido déficit de equipamiento.
- [ ] La comparación muestra la brecha de cada distrito frente al promedio municipal.
- [ ] El análisis de relación se presenta como exploratorio y sin afirmar causalidad.
- [ ] El repositorio incluye licencia de código abierto y atribución de fuentes.
- [ ] La interfaz diferencia claramente observaciones reales y ejemplos ilustrativos.
- [ ] El repositorio contiene instrucciones de despliegue y reproduce resultados principales.

---

## 10. Matriz de trazabilidad (resumen)

| Objetivo específico | Requerimientos |
|---|---|
| Integrar geometrías y capas municipales | RF-01, RF-16, RI-01, RD-01, RD-04 |
| Obtener series NDVI y LST por distrito | RF-10, RF-14, RD-02, RD-03, RI-04 |
| Calcular indicadores reproducibles | RF-15, RF-36, RD-07, RNF-12 |
| Diseñar el ICVSA histórico 1–100 | RF-11, RF-36, RF-37, RF-47, RN-01…RN-10 |
| Mapa web con filtros y mapas de calor | RF-01…RF-05, RF-38 (P0), RF-39 (opcional) |
| Gráficos, fichas y comparación | RF-09…RF-15, RF-21…RF-25, RF-42 |
| Hotspots explicables (ambiente y equipamiento) | RF-26…RF-30, RF-43, RN-11…RN-14 |
| Relación ambiente ↔ equipamiento/transporte | RF-41, RN-14, RN-20 |
| Publicar código, fuentes y límites | RF-31, RF-32, RF-33, RF-47, RNF-13, RNF-14, RNF-19 |
