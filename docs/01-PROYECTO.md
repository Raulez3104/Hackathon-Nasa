# 01 — Proyecto

**GeoQocha** — Tablero Satelital de Inteligencia Territorial y Calidad de Vida para los 15 Distritos Municipales de Cochabamba.

| Campo | Valor |
|---|---|
| Nombre del proyecto | GeoQocha |
| Desafío global | **Be An Earth System Trend Detective!** — NASA International Space Apps Challenge 2026 |
| Sede | Cochabamba, Bolivia |
| Categoría municipal GAMC | Transparencia, Participación Ciudadana, Movilidad y Planificación Urbana |
| Estado | Propuesta funcional y técnica para el desarrollo del MVP |
| Versión del documento | 1.1 |
| Última actualización | 13 de noviembre de 2026 |

---

## 1. Resumen ejecutivo

**GeoQocha** es una plataforma web interactiva, gratuita y de código abierto para explorar y comparar las condiciones socioambientales de los **15 distritos municipales de Cochabamba**. Combina series históricas de información satelital de la **NASA** con información geoespacial proporcionada por el **Gobierno Autónomo Municipal de Cochabamba (GAMC)** y un **copiloto de IA** que explica los datos con citas y advertencias metodológicas.

La plataforma busca responder tres preguntas centrales:

1. **¿Cómo está mi distrito?** — Vegetación, temperatura superficial, equipamientos y movilidad.
2. **¿Cómo ha cambiado?** — Tendencias de vegetación y temperatura a lo largo de los años.
3. **¿Dónde se necesitan estudios o intervenciones prioritarias?** — Identificación explicable de distritos con deterioro ambiental o déficits de equipamiento.

Los resultados se presentan mediante mapas, mapas de calor, gráficos de evolución, comparaciones entre distritos y un **Índice de Calidad de Vida Socio-Ambiental (ICVSA)** histórico de 1 a 100, con vista semaforizada alternativa, cuya metodología es pública y verificable.

El ICVSA se calcula para cada año del periodo: las dimensiones ambientales (NDVI y LST) varían anualmente, mientras que la dimensión territorial (equipamiento y movilidad) se fija en el año de referencia documentado de cada fuente municipal. Así se obtiene una serie histórica sin inventar datos municipales de años no observados.

> **Precaución:** el índice es un indicador sintético de apoyo al análisis, no una medición definitiva del bienestar ciudadano ni una determinación automática de prioridades de inversión.

---

## 2. Contexto y problemática

Los distritos municipales de Cochabamba pueden presentar condiciones diferentes de vegetación, temperatura superficial, disponibilidad de áreas verdes, servicios públicos y conectividad de transporte. Aunque existen datos capaces de describir estas diferencias, la información se encuentra repartida entre fuentes científicas y municipales y, en muchos casos, se publica en formatos geográficos o técnicos que resultan difíciles de interpretar para la población.

La NASA dispone de productos de observación terrestre con mediciones repetidas de vegetación y temperatura de la superficie. El GAMC cuenta con capas de límites distritales, áreas verdes, equipamientos, población, servicios y un recurso de rutas de transporte. Sin una herramienta que los vincule territorialmente, es difícil comparar distritos, detectar patrones de cambio y comunicar los resultados.

### Problema central

> **La información satelital y municipal no se encuentra suficientemente integrada en una herramienta accesible que facilite el análisis histórico y la comparación de las condiciones socioambientales de los 15 distritos de Cochabamba.**

### Preguntas que debe permitir responder el sistema

- ¿Qué distritos muestran mayor reducción o menor mejora en sus indicadores de vegetación?
- ¿Qué distritos presentan una **pérdida acelerada** de cobertura verde en la última década?
- ¿En qué distritos crece más la temperatura superficial y dónde las **islas de calor** se intensificaron con mayor severidad?
- ¿Cómo se **correlacionan** las tendencias ambientales con el acceso a equipamiento y transporte público?
- ¿Cómo se relacionan espacialmente las condiciones ambientales con la distribución actual de parques, centros educativos, centros de salud y rutas de transporte?
- ¿Qué diferencias existen entre dos distritos en un año o periodo determinado?
- ¿Qué distritos presentan señales de atención prioritaria según criterios explícitos?
- ¿Qué explican los datos sobre un distrito y qué estrategias de concientización o estudio se pueden plantear?

---

## 3. Objetivos

### Objetivo general

Desarrollar una plataforma web interactiva y de código abierto que integre datos satelitales de NASA y datos geoespaciales del GAMC para analizar tendencias ambientales históricas, visualizar equipamientos urbanos, comparar los 15 distritos municipales de Cochabamba y construir indicadores socioambientales transparentes que apoyen la comprensión y la toma de decisiones informadas.

### Objetivos específicos

1. Integrar las geometrías de los 15 distritos y las capas geográficas municipales relevantes.
2. Obtener, depurar y agregar series temporales satelitales de NDVI y LST por distrito.
3. Calcular indicadores ambientales y urbanos comparables, con metodología reproducible.
4. Diseñar un índice socioambiental compuesto de 1 a 100, con **serie histórica 2015–2025**, año de referencia territorial declarado y distinción explícita entre nivel, tendencia y brecha.
5. Desarrollar un mapa web con filtros por distrito, año, variable, capa geográfica y mapas de calor.
6. Incorporar gráficos temporales, fichas distritales, comparación de distritos y análisis de relación entre tendencias ambientales y acceso a equipamiento/transporte.
7. Señalar distritos con tendencias desfavorables o déficit de equipamiento mediante reglas explicables.
8. Publicar código abierto con licencia, fuentes, supuestos y limitaciones de los resultados.

### Indicadores de éxito del proyecto

| Dimensión | Indicador | Meta MVP |
|---|---|---|
| Cobertura territorial | Distritos con geometría validada | 15 / 15 |
| Cobertura temporal | Años con datos NDVI y LST | 2015–2025 (según disponibilidad real) |
| Integración | Capas municipales utilizables | ≥ 1 (ideal: varias) |
| Índice histórico | Años con ICVSA calculado por distrito | 2015–2025 |
| Brechas | Distritos comparados contra el promedio municipal | 15 / 15 |
| Transparencia | Metodología y fuentes publicadas | 100 % de los indicadores |
| Usabilidad | Tiempo hasta interpretar un distrito | < 3 minutos |

---

## 4. Usuarios destinatarios

| Usuario | Necesidad principal |
|---|---|
| **Ciudadanía** | Consultar la situación de su distrito de forma comprensible. |
| **Planificadores y funcionarios municipales** | Comparar indicadores y detectar necesidades de estudio. |
| **Investigadores y estudiantes** | Explorar series históricas y datos geográficos trazables. |
| **Organizaciones comunitarias** | Apoyar conversaciones públicas basadas en evidencia. |

### Necesidades por usuario

- **Ciudadanía:** lenguaje claro, sin jerga técnica, contexto de la escala del índice.
- **Municipio:** comparación entre distritos, exportación de datos, identificación de brechas.
- **Investigación:** acceso a datos crudos o procesados, metadatos, metodología y límites.
- **Comunidad:** visualizaciones compartibles y explicación de qué significa cada alerta.

---

## 5. Módulos del producto (resumen)

| Módulo | Propósito |
|---|---|
| **1. Dashboard general** | Mapa de los 15 distritos, coropletas y mapas de calor, filtros por año y ranking. |
| **2. Ficha distrital** | Serie histórica de NDVI/LST y del ICVSA, indicadores urbanos y metadatos de calidad. |
| **3. Equipamiento y movilidad** | Capas vectoriales y WMS del GAMC, consulta de atributos, rutas de transporte y paradas propuestas ilustrativas. |
| **4. Comparación** | Dos o más distritos lado a lado, series en el mismo eje y brechas frente al promedio municipal. |
| **5. Hotspots** | Reglas explícitas para señalar degradación ambiental o déficit de equipamiento. |
| **6. Análisis de relación** | Dispersión y co-ocurrencia entre tendencia ambiental y acceso a equipamiento/transporte. |
| **7. Copiloto IA** | Chat y diagnóstico automático que explica hechos precalculados con citas, sin calcular índices ni hotspots. |
| **8. Concientización** | Estrategias basadas en datos y mensajes ciudadanos sobre deforestación y pérdida de cobertura verde. |

El detalle funcional y los criterios de aceptación están en [`02-REQUERIMIENTOS.md`](./02-REQUERIMIENTOS.md).

---

## 6. Índice de Calidad de Vida Socio-Ambiental (ICVSA)

Escala de **1 a 100**, con vista alternativa semaforizada (verde/amarillo/rojo), que resume información multidimensional sin ocultar las variables originales.

| Dimensión | Peso de trabajo | Indicador | Comportamiento temporal |
|---|---:|---|---|
| Vegetación | 35 % | NDVI agregado por distrito | Varía cada año (2015–2025) |
| Temperatura superficial | 35 % | LST agregada, invertida para que menor exposición térmica puntúe mejor | Varía cada año (2015–2025) |
| Equipamiento urbano | 20 % | Acceso relativo a áreas verdes, salud y educación | Fijo en `t_ref` |
| Movilidad | 10 % | Cobertura o proximidad a recorridos de transporte | Fijo en `t_ref` |

### 6.1 Fórmula

\[
ICVSA_{d,t} = 0{,}35\,S^{NDVI}_{d,t} + 0{,}35\,S^{LST}_{d,t} + 0{,}20\,S^{EQ}_{d,t_{ref}} + 0{,}10\,S^{MOV}_{d,t_{ref}}
\]

- `ICVSA(d,t)`: índice del distrito `d` en el año `t` (2015–2025).
- `S`: puntuación normalizada 0–100 de cada dimensión.
- `t_ref`: año de referencia de la fuente municipal, documentado y visible en la interfaz.

La serie es **histórica** porque el 70 % de su peso varía año a año. El 30 % territorial se mantiene constante en `t_ref` y así se declara; **no se inventan valores municipales para años sin dato**.

### 6.2 Reglas de construcción

1. **Serie histórica obligatoria:** se publica un valor de ICVSA por distrito y año, graficable de 2015 a 2025.
2. **Año de referencia visible:** cada índice muestra `territorial_reference_year` y la fuente municipal usada.
3. **Sensibilidad:** se publica también `index_without_territorial` (solo NDVI + LST) para comparar cuánto aporta el componente municipal.
4. **Semáforo:** la interfaz permite alternar entre escala 1–100 y clases verde/amarillo/rojo.
5. **Datos faltantes:** se excluyen y se informa la cobertura; nunca se imputan como cero.
6. **Pesos iniciales no validados:** se publican junto con un análisis de sensibilidad.

### 6.3 Clasificación visual provisional

| Rango | Categoría | Color |
|---|---|---|
| 70–100 | Condición relativa favorable | Verde |
| 40–69 | Condición intermedia | Amarillo |
| 1–39 | Condición de atención | Rojo |

Rangos ilustrativos que deberán validarse. La clasificación no debe interpretarse como una evaluación oficial del GAMC.

La metodología completa y las reglas de datos faltantes están en [`02-REQUERIMIENTOS.md`](./02-REQUERIMIENTOS.md#7-reglas-de-negocio-y-metodología).

---

## 7. Propuesta de valor

> **De los datos satelitales a las decisiones distritales.**

GeoQocha no se limita a colocar imágenes sobre un mapa. Su objetivo es convertir ciencia abierta y datos municipales en respuestas verificables y comprensibles: **cómo se encuentra un distrito, cómo ha cambiado y qué señales requieren mayor atención**.

| Lo que ofrece | Diferencial |
|---|---|
| Observación satelital NASA + datos municipales GAMC | Integración territorial en una sola herramienta |
| Series 2015–2025 por distrito | Análisis de tendencia, no solo una fotografía |
| Índice y metodología abiertos | Resultados auditables y replicables |
| Hotspots con reglas explicables | Sin cajas negras: la IA explica, no decide |
| Copiloto IA con citas y fallback | Respuestas comprensibles y auditables |
| Código abierto y datos trazables | Reutilizable por municipio, academia y ciudadanía |

---

## 8. Alcance del MVP

**Esencial:** mapa full-screen de los 15 distritos, NDVI y LST, tendencias 2015–2025, capas WMS del GAMC, rutas y paradas propuestas de transporte, ficha distrital, panel demográfico, gráficos con Recharts, **ICVSA histórico con año de referencia territorial**, **mapa de calor de LST**, análisis de relación ambiente ↔ equipamiento/transporte, hotspots explicables, **copiloto IA con chat y diagnóstico**, **sección de deforestación y concientización** y documentación.

**Deseable:** mapa de calor de severidad, detección de aceleración, serie mensual, enlaces compartibles, más capas municipales, población y tasas verificadas, exportación CSV, indicadores de confianza y vista móvil accesible.

**Fuera del alcance inicial:** autenticación, edición de datos oficiales del GAMC, IA que calcule el índice o los hotspots, predicciones complejas, ruteo óptimo o tráfico en tiempo real, calificación oficial de seguridad de paradas y recomendaciones vinculantes de inversión.

La delimitación detallada está en [`02-REQUERIMIENTOS.md`](./02-REQUERIMIENTOS.md#8-alcance-del-mvp).

---

## 9. Índice de la documentación

| Documento | Contenido |
|---|---|
| [`01-PROYECTO.md`](./01-PROYECTO.md) | Visión, problema, objetivos, usuarios y valor |
| [`02-REQUERIMIENTOS.md`](./02-REQUERIMIENTOS.md) | Requerimientos funcionales, no funcionales, reglas y aceptación |
| [`03-ARQUITECTURA.md`](./03-ARQUITECTURA.md) | Componentes, stack, estructura del repositorio y despliegue |
| [`04-CONTRATOS-API.md`](./04-CONTRATOS-API.md) | Endpoints propios, esquemas de datos y proxy WMS |
| [`05-FUENTES-DATOS.md`](./05-FUENTES-DATOS.md) | GAMC, NASA, datos derivados y verificación pendiente |
| [`06-PLAN-DESARROLLO.md`](./06-PLAN-DESARROLLO.md) | Cronograma, roles, backlog, riesgos y entregables |

---

## 10. Alineación con el reto

| Requisito del reto | Respuesta del proyecto | Documento |
|---|---|---|
| Tablero web interactivo open source | Dashboard React + Vite, API Express y licencia abierta | `03`, `06` |
| 15 distritos municipales | Geometría validada y `district_id` único | `05` |
| Mínimo 2 variables NASA en un periodo | NDVI (MOD13Q1) y LST (MOD11A2), 2015–2025 | `05` |
| Índice socioambiental **histórico** 1–100 o semáforo | ICVSA anual con `t_ref` territorial y toggle semáforo | `02` §7.1 |
| Datos GAMC: parques, escuelas, salud y transporte | Capas vectoriales primero; WMS como visualización/fallback | `05` §2 |
| Gráficos de línea temporal por años | Series NDVI, LST e ICVSA en ficha y comparador | `02` RF-10, RF-36 |
| Mapas de calor | Mapa de calor de LST (severidad de hotspot en versión deseable) | `02` RF-38, RF-39 |
| Comparativa y brechas distritales | Comparador y diferencia vs promedio municipal | `02` RF-21…RF-25, RF-42 |
| Hotspots de degradación **y déficit de equipamiento** | Reglas explicables con contribución por variable | `02` RF-26…RF-30, RF-43 |
| Correlación ambiente ↔ transporte/equipamiento | Análisis exploratorio sin afirmar causalidad | `02` RF-41 |
| Explicación asistida por IA | Chat y diagnóstico con RAG, citas y fallback | `02` RF-48…RF-52, `04` §4.11 |
| UX/UI para ciudadanía y funcionarios | Lenguaje llano, móvil y accesible | `02` RNF-08, RF-45 |

---

## 11. Estado y procedencia

Los datos sobre el reto, el catálogo GAMC, los parámetros WMS y la existencia del GeoJSON provienen del enunciado y de la documentación compartida por el equipo. Los productos NASA, la arquitectura, el periodo 2015–2025, las ponderaciones y el cronograma constituyen la **propuesta técnica inicial**.

Todavía **no se incluyen resultados distritales medidos** ni se afirma haber validado los archivos GeoJSON o ejecutado extracciones satelitales. Ver [`05-FUENTES-DATOS.md`](./05-FUENTES-DATOS.md#7-verificación-pendiente-antes-de-implementar).
