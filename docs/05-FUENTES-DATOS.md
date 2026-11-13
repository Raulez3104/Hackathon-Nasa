# 05 — Fuentes de datos

Inventario de fuentes, estado de verificación, operaciones disponibles y precauciones metodológicas.

---

## 1. Resumen

| Fuente | Organismo | Tipo | Uso previsto | Estado |
|---|---|---|---|---|
| Catálogo WMS (7 servicios) | GAMC | OGC WMS 1.1.1 | Visualización de capas municipales y consulta puntual | Documentado |
| Capas vectoriales municipales (distritos, parques, equipamiento, educación, salud) | GAMC | Vector (shp/geojson/gpkg) | Conteos, áreas y accesibilidad por distrito | **Fuente primaria** según el reto; entrega por confirmar |
| GeoJSON de líneas de transporte | GAMC | GeoJSON | Dibujo de rutas y análisis de proximidad | Mencionado; por verificar |
| GeoJSON de distritos (equipo) | Por confirmar | GeoJSON | Geometrías de los 15 distritos | Disponible; estructura por verificar |
| MOD13Q1 (NDVI) | NASA | Raster MODIS | Serie de vegetación 2015–2025 | Propuesto |
| MOD11A2 (LST) | NASA | Raster MODIS | Serie de temperatura superficial 2015–2025 | Propuesto |

---

## 2. GAMC — Información municipal y geoespacial

**Documentación del proyecto:** https://recursosgamc.cochabamba.bo/api-doc
**Endpoint WMS indicado:** `https://serviciosgamc.cochabamba.bo/api/gs/wms`

La documentación compartida confirma un catálogo con **siete servicios WMS de solo lectura** y **un recurso de descarga GeoJSON de líneas de transporte**. El enunciado del reto indica además que el GAMC provee las **capas vectoriales** de los distritos, sus equipamientos y rutas de transporte.

### 2.1 Estrategia vector-first

1. **Solicitar y validar primero los vectores** (distritos, áreas verdes, equipamiento, educación, salud, población y transporte).
2. Usar los vectores para **conteos, superficies y accesibilidad**, que alimentan el ICVSA y los hotspots.
3. Usar el **WMS** para visualización, leyendas y `GetFeatureInfo` cuando no haya vector o como capa de contexto.
4. Si una capa solo existe como WMS, **no estimar indicadores** a partir de píxeles: marcar `insufficient_data`.

> Esta estrategia evita dos errores: calcular áreas contando píxeles de un PNG y presentar un índice con dimensiones que en realidad no se midieron.

### 2.2 Catálogo de capas

| Fuente municipal | Utilidad prevista | Estrategia / limitación |
|---|---|---|
| **Límite Distritos** | Localizar y visualizar distritos; vincular indicadores a cada territorio | Vector primario (GeoJSON del equipo o shapefile oficial); WMS como respaldo visual |
| **Áreas Verdes** | Representar parques y calcular superficie/área verde por habitante | Vector primario para áreas y conteos; WMS solo para visualización |
| **Áreas de Equipamiento** | Identificar espacios municipales y apoyar el índice de equipamiento | Vector primario; revisar categorías y atributos |
| **Población por Manzanas** | Denominadores demográficos y distribución de población | Tabla o vector agregable; verificar fecha, unidad y agregación |
| **Unidades Educativas** | Contar centros educativos y medir accesibilidad | Vector primario; verificar atributos y cobertura |
| **Centros de Salud** | Contar servicios sanitarios y medir accesibilidad | Vector primario; verificar atributos y cobertura |
| **Límite Urbano** | Contextualizar el área urbana según delimitación municipal | WMS o vector de contexto |
| **Líneas de Transporte** | Dibujar rutas y calcular cobertura/proximidad | **GeoJSON descargable**; validar URL, campos y fecha |

### 2.3 Operaciones disponibles

| Operación | Formato de salida | Uso |
|---|---|---|
| `GetMap` | `image/png` | Dibujar capas municipales sobre el mapa |
| `GetLegendGraphic` | `image/png` | Mostrar leyendas de las capas |
| `GetFeatureInfo` | `application/json` (según documentación) | Consultar atributos de elementos en un punto |

### 2.4 Detalles confirmados por la documentación

- Protocolo WMS **1.1.1** para mapas y consultas; leyendas con versión **1.0.0**.
- Parámetros obligatorios de acceso: `key` y `service_id`.
- `LAYERS` se envía vacío: el proxy resuelve la capa mediante el `service_id`.
- Para mapas web se muestra `SRS=EPSG:3857`; el servicio utiliza `BBOX`, `WIDTH`, `HEIGHT` y coordenadas de píxel para consultas.
- La capa de **Áreas Verdes** declara cobertura aproximada en WGS84: longitud **-66.2493 a -66.085546**, latitud **-17.502865 a -17.335849**. Esta extensión pertenece a esa capa, no necesariamente a todos los servicios.
- El ejemplo de `GetFeatureInfo` muestra una respuesta tipo `FeatureCollection`; `features: []` significa que no se identificaron elementos para esa consulta.

### 2.5 Restricción importante

> **WMS no equivale a una API de descarga masiva de geometrías vectoriales.** `GetMap` entrega imágenes y `GetFeatureInfo` consulta entidades bajo una posición determinada. No se debe suponer que estos métodos permiten extraer por completo las capas de parques, población, distritos o equipamientos. Para análisis de áreas, distancias y agregaciones hacen falta archivos vectoriales, tablas o servicios adicionales autorizados.

**Implicancia para el proyecto**

| Necesidad | ¿WMS alcanza? | Alternativa |
|---|---|---|
| Mostrar capas en el mapa | Sí | — |
| Consultar un elemento puntual | Sí (`GetFeatureInfo`) | — |
| Calcular área de áreas verdes | No | Vector oficial o tabla |
| Contar equipamientos por distrito | No (salvo consulta exhaustiva) | Vector/tabla |
| Población por distrito | No directamente | Tabla censal o capa con atributos |

### 2.6 Seguridad y uso de credenciales

- **No almacenar ni publicar claves reales** de GAMC en documentos, README, repositorios o código frontend.
- La documentación incluye ejemplos con una clave; **no reproducir esa credencial en el proyecto**. Si es operativa, solicitar su rotación o una clave específica para el despliegue.
- En producción consumir GAMC a través de un **backend/proxy propio** que agregue `key` desde variables de entorno.
- Validar `service_id` contra una lista autorizada; limitar operaciones, parámetros y volumen de consultas.
- Comprobar condiciones de uso, permisos de publicación, política de caché y límites de acceso del GAMC.

**Ejemplo conceptual con credenciales ficticias**

```text
GET /api/gamc/wms?service_id=<UUID_AUTORIZADO>
    &SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap
    &LAYERS=&FORMAT=image/png&TRANSPARENT=true
    &SRS=EPSG:3857&BBOX=<minX,minY,maxX,maxY>
    &WIDTH=256&HEIGHT=256
```

El backend incorpora `key` al reenviar la solicitud al endpoint municipal. Los parámetros concretos del proxy y los requisitos de `GetFeatureInfo` deben validarse en una prueba funcional.

---

## 3. NASA — Información satelital ambiental

Se trabaja con dos variables mínimas exigidas por el desafío.

| Variable | Producto propuesto | Resolución aprox. | Frecuencia del producto | Interpretación |
|---|---|---|---|---|
| **NDVI** (Normalized Difference Vegetation Index) | **MODIS MOD13Q1, colección 6.1** | **250 m** | **16 días** | Índice de verdor/vigor; valores altos suelen indicar vegetación más densa o activa |
| **LST** (Land Surface Temperature) | **MODIS MOD11A2, colección 6.1** | **1 km** | **8 días** | Temperatura de la superficie terrestre; **no** es temperatura del aire |

**Periodo objetivo del MVP:** **2015–2025** (11 años calendario, incluyendo ambos extremos). La cobertura real, la calidad y la disponibilidad por distrito deben comprobarse.

### 3.1 Fuentes y documentación

- NASA Earthdata: https://www.earthdata.nasa.gov/
- NASA AppEEARS: https://appeears.earthdatacloud.nasa.gov/
- Catálogo MOD13Q1 (GEE): https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1
- Catálogo MOD11A2 (GEE): https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD11A2
- Google Earth Engine: https://earthengine.google.com/

### 3.2 Procesamiento

1. Validar o transformar a un sistema de coordenadas compatible el GeoJSON de distritos.
2. Cargar polígonos distritales en un flujo geoespacial (Earth Engine o Python).
3. Seleccionar productos MODIS, bandas y criterios de calidad apropiados.
4. Filtrar observaciones de baja calidad, nubes y valores no válidos mediante bandas QA.
5. Convertir LST usando el factor de escala y unidades documentadas por el producto.
6. Agregar los valores en ventanas **anuales** estables y, opcionalmente, **mensuales**; para NDVI usar la misma ventana estacional en todos los años.
7. Calcular estadísticas zonales por distrito para NDVI y LST.
8. Registrar disponibilidad de observaciones, cobertura espacial y limitaciones de resolución.
9. Exportar una tabla por **distrito-año** (y `distrito-mes` si se habilita) para el backend.
10. Calcular tendencias, **aceleración** (2015–2020 vs. 2020–2025) y significancia con estadísticas reproducibles.
11. Integrar equipamiento y movilidad con su `territorial_reference_year` y construir el **ICVSA histórico** (ambiente anual + territorio fijo).
12. Generar hotspots, brechas vs. promedio municipal, correlación exploratoria y mapas de calor.

### 3.3 Precauciones metodológicas

- La **LST de 1 km** puede ser demasiado gruesa para distritos pequeños o variaciones internas.
- Los productos satelitales contienen observaciones inválidas; evaluar calidad y cobertura.
- NDVI varía estacionalmente; comparar años sin controlar estacionalidad puede producir conclusiones engañosas.
- Las agregaciones mensuales deben construirse solo con observaciones válidas y no reemplazan la serie anual oficial.
- No inferir causalidad entre cambios ambientales, equipamiento y transporte con correlaciones simples.
- Documentar factor de escala, unidades y versión de colección usada.
- Reportar cuántas observaciones válidas respaldan cada promedio anual.
- Declarar el `territorial_reference_year` usado en el ICVSA y no interpolarlo.

### 3.4 Controles de calidad sugeridos

| Control | Descripción |
|---|---|
| Filtro QA | Descartar píxeles marcados como nube, sombra o relleno. |
| Cobertura mínima | No publicar un promedio si la fracción de píxeles válidos es demasiado baja. |
| Ventana estacional | Usar el mismo periodo del año para todos los años comparados. |
| Conteo de observaciones | Exponer `*_valid_observation_count` y `*_valid_pixel_fraction`. |
| Marca de calidad | `ok`, `partial`, `insufficient` por registro. |

---

## 4. Datos derivados del proyecto

| Producto | Descripción | Ubicación |
|---|---|---|
| `districts.geojson` | Geometrías validadas de los 15 distritos | `data/geojson/` |
| `transport.geojson` | Rutas de transporte validadas | `data/geojson/` |
| `equipment.geojson` | Parques, escuelas, salud y equipamiento municipal | `data/geojson/` |
| `district_year.json` | NDVI, LST, ICVSA, calidad y cobertura por distrito-año | `data/processed/` |
| `district_month.json` | Serie mensual opcional | `data/processed/` |
| `trends.json` | Pendientes, aceleración e interpretación | `data/processed/` |
| `equipment_metrics.json` | Acceso, tasas y déficit por distrito | `data/processed/` |
| `hotspots.json` | Marcas, reglas activadas y explicación | `data/processed/` |
| `correlations.json` | Dispersión y coeficientes exploratorios | `data/processed/` |
| `heatmap_lst.json` | Celdas o referencia de raster para mapas de calor | `data/processed/` |
| `index.json` | ICVSA y `index_without_territorial` | `data/processed/` |
| `sources.json` | Metadatos, fechas, licencias y limitaciones | `data/metadata/` |

Se generan además:

- Indicadores de población y equipamiento **solo cuando existan datos suficientes**.
- Cobertura/proximidad de rutas **solo si** el GeoJSON lo permite.

---

## 5. Diccionario de datos

### 5.1 Registro distrito-año

| Campo | Tipo | Unidad | Nulo permitido | Notas |
|---|---|---|---|---|
| `district_id` | entero | — | No | 1–15, estable en todas las fuentes. |
| `year` | entero | año | No | 2015–2025. |
| `ndvi_mean` | número | índice | Sí | Rango −1 a 1. |
| `ndvi_valid_observation_count` | entero | conteo | Sí | Observaciones válidas del año. |
| `ndvi_valid_pixel_fraction` | número | 0–1 | Sí | Cobertura espacial válida. |
| `lst_mean_celsius` | número | °C | Sí | Temperatura superficial diurna media. |
| `lst_valid_pixel_fraction` | número | 0–1 | Sí | Cobertura espacial válida. |
| `environmental_index` | número | 1–100 | Sí | Índice NDVI+LST del año. |
| `socioenvironmental_index` | número | 1–100 | Sí | ICVSA del año; territorio fijo en `t_ref`. |
| `index_without_territorial` | número | 1–100 | Sí | Sensibilidad: solo NDVI + LST. |
| `territorial_reference_year` | entero | año | No | Año de referencia municipal. |
| `equipment_access_index` | número | 0–100 | Sí | Acceso a parques, salud y educación. |
| `mobility_access_index` | número | 0–100 | Sí | Cobertura/proximidad de transporte. |
| `data_quality_flag` | enum | — | No | `ok` \| `partial` \| `insufficient`. |

### 5.2 Atributos municipales (a confirmar)

| Campo | Fuente | Estado |
|---|---|---|
| Nombre del distrito | Límite Distritos | Por confirmar atributo exacto |
| Población | Población por Manzanas | Por confirmar fecha y agregación |
| `territorial_reference_year` | Conjunto de fuentes municipales | Obligatorio al publicar |
| Área verde registrada (m²) | Áreas Verdes (vector) | Requiere vector |
| Área verde por habitante | Áreas Verdes + Población | Requiere ambos |
| N.º de unidades educativas | Unidades Educativas (vector) | Requiere vector |
| Escuelas por 1.000 habitantes | Educación + Población | Requiere ambos |
| N.º de centros de salud | Centros de Salud (vector) | Requiere vector |
| Centros de salud por 1.000 habitantes | Salud + Población | Requiere ambos |
| Cobertura de transporte | Líneas de Transporte (GeoJSON) | Requiere GeoJSON válido |
| Longitud de rutas | Líneas de Transporte | Requiere GeoJSON válido |

---

## 6. Atribución y licencias

| Fuente | Atribución mínima | Estado de licencia |
|---|---|---|
| NASA MODIS | «Datos: NASA MODIS MOD13Q1 / MOD11A2, colección 6.1» | Verificar términos NASA Earthdata |
| GAMC WMS | «Fuente: Gobierno Autónomo Municipal de Cochabamba» | Verificar condiciones de uso |
| GeoJSON municipal | Según origen del archivo | Por confirmar |
| OpenStreetMap (si se usa mapa base) | «© OpenStreetMap contributors» | ODbL |

**Licencias del proyecto**

| Componente | Licencia propuesta | Requisito |
|---|---|---|
| Código fuente | MIT (o Apache-2.0) | Archivo `LICENSE` en la raíz |
| Documentación | CC BY 4.0 | Atribución visible |
| Datos derivados propios | CC BY 4.0, si las fuentes lo permiten | No relicenciar datos del GAMC sin permiso |

> Antes de publicar, confirmar permisos de reproducción y redistribución de los datos municipales. La licencia abierta del código no autoriza automáticamente a redistribuir datos de terceros.

---

## 7. Verificación pendiente antes de implementar

1. **GeoJSON de distritos:** confirmar nombre, origen, capa contenida, sistema de coordenadas, atributos de identificación distrital y licencia.
2. **Capas vectoriales del GAMC:** confirmar entrega de distritos, áreas verdes, equipamiento, educación, salud y población; formato (shp/geojson/gpkg), atributos, fecha y licencia.
3. **Transporte:** obtener el archivo descargable y revisar rutas, campos, cobertura y fecha.
4. **Población por manzanas:** confirmar si se pueden acceder a valores y geometrías agregables, y año censal o administrativo.
5. **Equipamientos:** comprobar si existen archivos vectoriales o tablas completas, además de WMS/`GetFeatureInfo`.
6. **Servicio WMS:** verificar `service_id` de cada capa, códigos de respuesta, capas y compatibilidad real del proxy con `GetFeatureInfo`.
7. **NASA:** confirmar resultados, máscaras QA y calidad de ambas series en los 15 distritos.
8. **Metodología del ICVSA:** acordar normalización, pesos, `t_ref`, tratamiento de vacíos e interpretación.
9. **Términos de uso:** revisar permisos de reproducción de datos del GAMC y atribución NASA.

### Checklist operativo

- [ ] El GeoJSON abre y contiene 15 polígonos.
- [ ] El CRS está identificado y es transformable.
- [ ] Los `district_id` coinciden entre GeoJSON, NASA y datos municipales.
- [ ] Existen vectores de áreas verdes, educación, salud y transporte (o se declara su ausencia).
- [ ] Cada `service_id` responde con `GetMap`.
- [ ] `GetFeatureInfo` devuelve JSON utilizable.
- [ ] El proxy funciona sin exponer la clave.
- [ ] Las series NASA cubren 2015–2025 con cobertura aceptable.
- [ ] La serie mensual, si existe, se construye con observaciones válidas.
- [ ] Cada registro conserva fuente, fecha y `territorial_reference_year`.
- [ ] Licencias revisadas antes de publicar.
- [ ] `LICENSE` y atribución visibles en el repositorio y la app.

---

## 8. Enlaces de referencia

**Municipio de Cochabamba**

- Portal de documentación: https://recursosgamc.cochabamba.bo/api-doc
- Servicio WMS base: https://serviciosgamc.cochabamba.bo/api/gs/wms

**NASA / geoespacial**

- NASA Earthdata: https://www.earthdata.nasa.gov/
- NASA AppEEARS: https://appeears.earthdatacloud.nasa.gov/
- MOD13Q1 (NDVI): https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1
- MOD11A2 (LST): https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD11A2
- Google Earth Engine: https://earthengine.google.com/

**Tecnologías**

- Leaflet: https://leafletjs.com/
- React Leaflet: https://react-leaflet.js.org/
- Recharts: https://recharts.org/
- PostGIS: https://postgis.net/
