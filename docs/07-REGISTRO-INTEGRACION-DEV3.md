# Registro de integración DEV3 — GeoQocha

**Fecha:** 2026-11-13
**Rama:** `feature/dev3-nasa`
**Responsable:** DEV3
**Estado:** cerrado el trabajo de DEV3 y la integración con el portal GAMC; pendiente la integración de datos reales de DEV2

---

## 1. Propósito

Este documento registra, de forma verificable, todo el trabajo realizado sobre la rama `feature/dev3-nasa`:

1. Implementación y publicación de las seis tareas de DEV3.
2. Integración de los cambios de los compañeros publicados en `main`.
3. Conexión del catálogo real de servicios WMS del GAMC.
4. Integración de la vista de analítica en la aplicación principal.
5. Verificaciones ejecutadas y estado de cada commit.
6. Brechas conocidas y trabajo pendiente.

No se reproduce ninguna credencial del GAMC en este documento ni en el repositorio.

---

## 2. Estado de la rama

| Elemento | Valor |
|---|---|
| Rama de trabajo | `feature/dev3-nasa` |
| Último commit publicado | `8f2f93e` |
| Estado del árbol | Limpio, sin cambios pendientes |
| Sincronización | Local = remoto = `8f2f93e` |
| Rama base integrada | `origin/main` (`3303822`) |
| Remoto | `https://github.com/Raulez3104/Hackathon-Nasa.git` |

### 2.1 Historial de commits

| Commit | Tipo | Descripción |
|---|---|---|
| `211728a` | Tarea | `feat(dev3): T3-01 - Panel distrital y comparador con estado en URL` |
| `c5cf815` | Tarea | `feat(dev3): T3-02 - Fichas distritales, brechas y series historicas con Recharts` |
| `2ea24a9` | Tarea | `feat(dev3): T3-03 - Deforestacion y concientizacion ambiental` |
| `12287a9` | Tarea | `feat(dev3): T3-04 - Widget flotante de chat IA con fallback local` |
| `d56adc7` | Tarea | `feat(dev3): T3-05 - Tarjetas de diagnostico automatico con evidencia y citas` |
| `e03fc3c` | Tarea | `feat(dev3): T3-06 - Hotspots, metodologia, fuentes y calidad de UI` |
| `67cd7be` | Integración | `Merge remote-tracking branch 'origin/main' into feature/dev3-nasa` |
| `b687987` | Configuración | `feat(gamc): conecta catalogo real de servicios WMS` |
| `8f2f93e` | Integración | `feat(dev3): integra vista de analitica en la app principal` |

Cada tarea de DEV3 tiene un commit individual y fue publicada por separado con `git push`.

---

## 3. Tareas DEV3 implementadas

### 3.1 T3-01 — Panel distrital y comparador

**Commit:** `211728a`

**Entregables principales:**

- `frontend/src/components/analytics/AnalyticsWorkspace.tsx`
- `frontend/src/components/analytics/DistrictPanel.tsx`
- `frontend/src/components/analytics/ComparisonPanel.tsx`
- `frontend/src/components/analytics/use-focus-trap.ts`
- `frontend/src/components/analytics/use-url-state.ts`
- `frontend/src/components/analytics/load-dataset.ts`
- `frontend/src/components/analytics/stats.ts`
- `frontend/src/components/analytics/format.ts`
- `frontend/src/components/analytics/types.ts`

**Criterios cubiertos:**

- Apertura y cierre con teclado, trampa de foco y cierre con `Escape`.
- Lectura de `district` y `districts` desde la URL.
- Comparación de dos distritos lado a lado.
- Estados de carga, vacío y error.
- Diseño responsive sin desbordes en móvil.
- Pruebas de panel y de estado en URL.

### 3.2 T3-02 — Fichas, brechas y series con Recharts

**Commit:** `c5cf815`

**Entregables principales:**

- `frontend/src/components/analytics/DistrictProfile.tsx`
- `frontend/src/components/analytics/SeriesChart.tsx`
- Ampliación de `stats.ts` y `analytics.css`
- Pruebas `DistrictProfile.test.tsx`, `SeriesChart.test.tsx` y `stats.test.ts`

**Criterios cubiertos:**

- Población y brechas frente al promedio municipal.
- Brechas de salud y educación.
- Series NDVI, LST e ICVSA para 2015–2025.
- Calidad del dato y representación explícita de `null` como «No disponible».
- Tooltips accesibles y formato regional `es-BO`.

### 3.3 T3-03 — Deforestación y concientización

**Commit:** `2ea24a9`

**Entregables principales:**

- `frontend/src/components/awareness/AwarenessPanel.tsx`
- `frontend/src/components/awareness/awareness-rules.ts`
- `frontend/src/components/awareness/awareness.css`
- Pruebas de panel y de reglas

**Criterios cubiertos:**

- Estrategias basadas en datos y mensajes ciudadanos.
- Citas de fuente en cada afirmación.
- Sin afirmaciones de causalidad ni cifras inventadas.
- Distinción visible de datos ilustrativos.

### 3.4 T3-04 — Widget flotante de chat IA

**Commit:** `12287a9`

**Entregables principales:**

- `frontend/src/components/ai/ChatWidget.tsx`
- `frontend/src/components/ai/ai-client.ts`
- `frontend/src/components/ai/local-fallback.ts`
- `frontend/src/components/ai/chat.css`
- Pruebas `ChatWidget.test.tsx`

**Criterios cubiertos:**

- Envío de mensajes al endpoint `/api/ai-analyst`.
- Historial de conversación, estado de carga, error y reintento.
- Citas y advertencia de alcance.
- Uso de fixture local cuando la API no está disponible.

### 3.5 T3-05 — Tarjetas de diagnóstico

**Commit:** `d56adc7`

**Entregables principales:**

- `frontend/src/components/ai/DiagnosisCards.tsx`
- `frontend/src/components/ai/diagnosis.css`
- Pruebas `DiagnosisCards.test.tsx`

**Criterios cubiertos:**

- Consumo de `mode: "diagnosis"`.
- Renderizado de `insights`, severidad, evidencia y citas.
- Reintento ante fallo.
- Funcionamiento con fallback local si la API falla.

### 3.6 T3-06 — Hotspots, metodología, fuentes y calidad

**Commit:** `e03fc3c`

**Entregables principales:**

- `frontend/src/components/analytics/HotspotsPanel.tsx`
- `frontend/src/components/analytics/hotspot-rules.ts`
- `frontend/src/components/analytics/MethodologyPanel.tsx`
- `frontend/src/components/analytics/methodology-data.ts`
- `frontend/src/components/analytics/SourcesPanel.tsx`
- `frontend/src/components/analytics/source-catalog.ts`
- `frontend/src/components/analytics/panels.css`
- `frontend/src/components/README.md`
- Pruebas de hotspots, metodología y fuentes

**Criterios cubiertos:**

- Hotspots con reglas activadas y contribuciones explicables.
- Publicación de fórmula, pesos, `territorial_reference_year` y tratamiento de faltantes.
- Catálogo de fuentes con origen, licencia y limitaciones.
- Responsive, contraste, foco, `prefers-reduced-motion` y estados vacíos/error.
- README de componentes y fixtures.

---

## 4. Integración de los cambios de los compañeros

### 4.1 Situación encontrada

Al actualizar el remoto aparecieron ramas nuevas y actualizadas:

| Rama | Commit | Contenido |
|---|---|---|
| `origin/main` | `3303822` | Incluye el trabajo de DEV1 y el proxy WMS real |
| `origin/dev1` | `16cd5e8` | Capa WMS real y proxy seguro |
| `origin/Dev2` | — | Sin commits propios que no estuvieran ya en `main` |

Se verificó que `origin/Dev2` está completamente contenido en `main`, por lo que no había trabajo de DEV2 pendiente de integrar.

### 4.2 Merge realizado

Se ejecutó un merge normal, sin rebase ni force-push:

```text
git merge origin/main --no-ff
```

**Commit resultante:** `67cd7be`

**Conflictos resueltos:**

- `frontend/package.json`
- `frontend/package-lock.json`

**Criterio de resolución:** unión de dependencias de ambos frentes.

- Se conservó `@tailwindcss/vite` y la configuración de Tailwind de DEV1.
- Se conservaron Vitest, Testing Library, jsdom y los scripts de prueba de DEV3.
- Se regeneró `package-lock.json` con `npm install`.

**Verificación posterior al merge:**

- `npm run typecheck` sin errores.
- `npm test` con 83 pruebas aprobadas.
- `npm run build` correcto.
- `npm run validate:mock` correcto.

---

## 5. Conexión del catálogo real del GAMC

### 5.1 Fuente de la información

El portal `https://recursosgamc.cochabamba.bo/` es una aplicación Angular. La información operativa no está en el HTML inicial, sino en el bundle JavaScript del portal, en particular en `chunk-HSJDSVYG.js`.

Del bundle se extrajeron únicamente datos públicos:

- endpoint WMS;
- catálogo de servicios del proyecto del reto;
- nombres de capas y extensiones;
- recursos descargables.

El portal también expone una clave de API en su JavaScript. Esa clave **no se copió** al repositorio, al frontend, a los logs ni a la documentación.

### 5.2 Proyecto identificado

El reto corresponde al proyecto **5, «Be An Earth System Trend Detective!»**. El portal lo publica con siete servicios WMS de solo lectura, protocolo WMS 1.1.1 y leyendas con `GetLegendGraphic` 1.0.0.

**Endpoint:** `https://serviciosgamc.cochabamba.bo/api/gs/wms`

### 5.3 Catálogo confirmado

| Capa | Tipo | `service_id` | Extensión WGS84 (minLon, minLat, maxLon, maxLat) |
|---|---|---|---|
| Límite Distritos | Simple | `7eb13092-bf0e-493b-aae6-03c43eedda2c` | -66.280703, -17.53119, -66.06952, -17.257306 |
| Límite Urbano | Simple | `fd77d463-9729-4c66-b686-23dccbb4ab8f` | -66.251426, -17.50846, -66.084188, -17.332785 |
| Áreas Verdes | Simple | `47360ddc-e35f-4ece-a995-59e90eb79cc6` | -66.2493, -17.502865, -66.085546, -17.335849 |
| Población por Manzanas | Simple | `194a02a0-a73a-48c1-a260-82847c5c905d` | -66.280703, -17.53119, -66.06952, -17.257306 |
| Áreas de Equipamiento | Simple | `97a589fe-595e-45dd-91d4-38524877f1ed` | -66.252843, -17.505306, -66.084417, -17.271602 |
| Unidades Educativas | Simple | `7655ba3d-5d9e-44ff-bf65-26f81f83d7ec` | -66.280703, -17.53119, -66.06952, -17.257306 |
| Centros de Salud | Simple | `e40fa280-f649-4614-9526-1b3dcce596b3` | -66.280703, -17.53119, -66.06952, -17.257306 |

### 5.4 Recursos descargables confirmados

| Recurso | URL |
|---|---|
| Líneas de transporte | `https://recursosgamc.cochabamba.bo/assets/geo/lineas_de_transporte.rar` |
| Red MÓNICA | `https://recursosgamc.cochabamba.bo/assets/geo/red_monica.zip` |

### 5.5 Cambios aplicados

**Commit:** `b687987`

| Archivo | Cambio |
|---|---|
| `backend/.env.example` | Los siete `service_id` públicos en `GAMC_ALLOWED_SERVICE_IDS` |
| `frontend/.env.example` | `VITE_GAMC_EQUIPMENT_SERVICE_ID` con la capa de equipamiento |
| `docs/05-FUENTES-DATOS.md` | Catálogo confirmado, extensiones y enlaces de descarga |

Se mantuvo la lista blanca del proxy limitada a los siete servicios del proyecto. Las capas de otros proyectos del portal (Cota 2750, cuencas, drenaje, emergencias, periurbanos) no se habilitaron.

### 5.6 Configuración local

Se crearon dos archivos locales, ambos ignorados por Git:

- `backend/.env`: contiene `GAMC_API_KEY` y la lista blanca. No se versiona.
- `frontend/.env`: contiene únicamente `VITE_DATA_MODE`, `VITE_API_BASE_URL` y el `service_id` de equipamiento. No contiene la clave.

La clave del GAMC quedó exclusivamente en el backend.

### 5.7 Pruebas reales contra el servicio

Con el backend en ejecución se probaron las tres operaciones a través del proxy propio:

| Prueba | Resultado |
|---|---|
| `GET /api/health` | `200 OK` |
| `GetLegendGraphic` | `200`, `image/png` |
| `GetMap` | `200`, `image/png`, 29 938 bytes |
| `GetFeatureInfo` | `200`, `application/json`, con atributos reales: `Distrito: D06`, `Sub Alcaldía: SA7`, `Zona: Z16`, `Área: URB` |

Esto confirma que el proxy valida el `service_id`, agrega la clave en el servidor y devuelve datos reales del GAMC.

---

## 6. Integración de la vista DEV3 en la aplicación principal

### 6.1 Problema detectado

Antes de este cambio, la aplicación que se servía (`index.html` → `main.tsx` → `App.tsx`) solo mostraba el mapa de DEV1. La vista `dev3.tsx` existía, pero no era una entrada de Vite ni se importaba desde la app. Por eso las tareas DEV3 estaban implementadas y probadas, pero no visibles al usuario.

### 6.2 Solución aplicada

**Commit:** `8f2f93e`

| Archivo | Cambio |
|---|---|
| `frontend/src/App.tsx` | Selector Mapa/Analítica y montaje de `AnalyticsWorkspace` |
| `frontend/src/App.test.tsx` | Prueba de cambio de vista y estado `aria-pressed` |
| `frontend/src/styles.css` | Estilos del selector y ajuste responsive |
| `frontend/index.html` | Título y descripción actualizados a GeoQocha |

**Decisiones técnicas:**

- `AnalyticsWorkspace` se carga con `React.lazy` y `Suspense` para que el mapa conserve su peso.
- El año seleccionado en el mapa se comparte con la vista de analítica.
- La vista de analítica incluye panel distrital, comparación, hotspots, metodología, fuentes, concientización, diagnóstico y chat.
- La app muestra «Datos ilustrativos» mientras no existan los endpoints de DEV2.

### 6.3 Resultado del build

| Artefacto | Tamaño |
|---|---|
| `index.html` | 0,58 kB |
| CSS principal | 39,25 kB |
| JS del mapa | 387,88 kB |
| JS de analítica (carga diferida) | 474,16 kB |
| CSS de analítica (carga diferida) | 29,68 kB |

El mapa ya no carga el código de analítica; el chunk se descarga solo al pulsar **Analítica**.

---

## 7. Verificación ejecutada

| Comprobación | Comando | Resultado |
|---|---|---|
| Tipos frontend | `npm run typecheck` | Sin errores |
| Pruebas frontend | `npm test` | 84 pruebas, 14 archivos, todas aprobadas |
| Build frontend | `npm run build` | Correcto, con separación de chunks |
| Mock | `npm run validate:mock` | 15 distritos y 11 observaciones por serie |
| Tipos backend | `npm run typecheck` | Sin errores |
| Salud backend | `GET /api/health` | 200 OK |
| WMS GetMap | Proxy `/api/gamc/wms` | 200, PNG |
| WMS GetLegendGraphic | Proxy `/api/gamc/wms` | 200, PNG |
| WMS GetFeatureInfo | Proxy `/api/gamc/wms` | 200, JSON con datos reales |
| Tablas Markdown | Verificación de columnas | Consistentes |
| Secretos | Búsqueda de asignaciones de `GAMC_API_KEY` con valor | Sin coincidencias en docs y README |

---

## 8. Reglas del proyecto respetadas

- La clave del GAMC nunca se expuso en frontend, repositorio, logs ni documentación.
- Todo acceso al GAMC pasa por el proxy propio con lista blanca.
- No se calcularon áreas ni indicadores a partir de píxeles del WMS.
- No se inventaron datos municipales.
- Los valores `null` se muestran como «No disponible».
- Los datos ilustrativos están etiquetados como tales.
- La IA no calcula cifras: solo redacta y explica hechos precalculados.
- Se distinguió el trabajo real del mock en todo momento.

---

## 9. Brechas conocidas y pendientes

### 9.1 Endpoints de datos y de IA (DEV2)

El backend actual solo expone:

- `GET /api/health`
- `GET /api/gamc/wms`

No existen todavía:

- `GET /api/districts`
- `GET /api/districts/:id`
- `GET /api/districts/:id/indicators`
- `GET /api/comparison`
- `GET /api/hotspots`
- `GET /api/heatmap`
- `GET /api/analysis/correlation`
- `GET /api/methodology`
- `GET /api/sources`
- `POST /api/ai-analyst`

Por eso la vista de analítica funciona con el mock y con fallbacks locales. Esto **no se puede resolver con el portal del GAMC**: ese portal solo ofrece WMS (imágenes y atributos puntuales), no series NDVI/LST, ICVSA, hotspots ni IA.

### 9.2 Dependencias pendientes

- Pipeline NASA de DEV2 para generar datos reales 2015–2025.
- Clave de proveedor de IA configurada solo en el backend.
- Revisión de licencias y términos de uso de datos municipales.
- Validación de paradas de transporte como propuestas ilustrativas.

### 9.3 Deuda menor

- `frontend/dev3.html` quedó como entrada de desarrollo y ya no es necesaria para la app principal; puede eliminarse en una limpieza posterior.
- El aviso de build sobre tamaño de chunks desapareció al separar la analítica, pero conviene mantener la carga diferida.

### 9.4 Seguridad de la clave GAMC

El portal publica una clave en su JavaScript. Aunque la clave quedó solo en `backend/.env`, al ser pública y compartida conviene:

1. Confirmar con el GAMC que es la clave asignada al proyecto.
2. Solicitar una clave específica para el despliegue.
3. Rotarla si estuvo expuesta más tiempo del previsto.

---

## 10. Cómo ejecutar el proyecto

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend, en otra terminal
cd frontend
npm install
npm run dev
```

Luego abrir `http://localhost:5173` y usar el selector **Mapa / Analítica**.

**Requisitos locales:**

- `backend/.env` con `GAMC_API_KEY` y `GAMC_ALLOWED_SERVICE_IDS`.
- `frontend/.env` con `VITE_API_BASE_URL` y `VITE_GAMC_EQUIPMENT_SERVICE_ID`.
- Los archivos `.env` no se versionan.

---

## 11. Archivos relevantes

| Ruta | Rol |
|---|---|
| `frontend/src/App.tsx` | Shell principal y selector de vistas |
| `frontend/src/components/analytics/` | Analítica, hotspots, metodología y fuentes |
| `frontend/src/components/awareness/` | Concientización ambiental |
| `frontend/src/components/ai/` | Chat y diagnóstico |
| `frontend/src/components/map/` | Mapa, capas y controles de DEV1 |
| `backend/src/routes/gamc.ts` | Proxy WMS |
| `backend/src/gamc/wms.ts` | Validación y lista blanca |
| `shared/types/geoqocha.ts` | Contrato compartido |
| `docs/05-FUENTES-DATOS.md` | Catálogo de fuentes y servicios GAMC |
| `frontend/.env.example` | Variables públicas de ejemplo |
| `backend/.env.example` | Variables del backend, sin clave |

---

## 12. Referencias

- Portal GAMC: https://recursosgamc.cochabamba.bo/api-doc
- Endpoint WMS: https://serviciosgamc.cochabamba.bo/api/gs/wms
- Líneas de transporte: https://recursosgamc.cochabamba.bo/assets/geo/lineas_de_transporte.rar
- Red MÓNICA: https://recursosgamc.cochabamba.bo/assets/geo/red_monica.zip
- Repositorio: https://github.com/Raulez3104/Hackathon-Nasa
