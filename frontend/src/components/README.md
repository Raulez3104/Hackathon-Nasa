# Componentes DEV3 — Analítica y concientización

Este directorio agrupa la interfaz del frente **DEV3** de GeoQocha. Todos los componentes consumen los tipos compartidos de `shared/types/geoqocha.ts` y respetan el contrato de `docs/04-CONTRATOS-API.md`. La UI está en español; los identificadores de código, en inglés.

## Estructura

| Ruta | Responsabilidad |
|---|---|
| `analytics/AnalyticsWorkspace.tsx` | Vista de desarrollo e integración con navegación entre paneles. |
| `analytics/DistrictPanel.tsx` | Panel distrital deslizable o en línea, con estado en la URL y foco atrapado. |
| `analytics/ComparisonPanel.tsx` | Comparación de hasta cinco distritos. |
| `analytics/DistrictProfile.tsx` | Población, brechas municipales, salud, educación, áreas verdes y calidad del dato. |
| `analytics/SeriesChart.tsx` | Series NDVI/LST/ICVSA con Recharts y tabla accesible alternativa. |
| `analytics/HotspotsPanel.tsx` | Ranking de distritos con reglas activadas, valores observados y contribuciones. |
| `analytics/MethodologyPanel.tsx` | Fórmula, pesos, `t_ref`, política de faltantes, clasificación y calidad del dato. |
| `analytics/SourcesPanel.tsx` | Catálogo de fuentes con licencia, transformaciones, limitaciones y tipo de dato. |
| `awareness/AwarenessPanel.tsx` | Pérdida verde, estrategias basadas en datos y mensajes ciudadanos. |
| `ai/ChatWidget.tsx` | Copiloto flotante con historial, citas, reintento y fallback local. |
| `ai/DiagnosisCards.tsx` | Tarjetas de diagnóstico con severidad, evidencia y citas. |

## Reglas de presentación

- **`null` es «No disponible»**, nunca cero. Los componentes usan `format.ts` para no imputar valores.
- **El color no es el único portador de significado.** Semáforos, prioridades y severidades incluyen texto e ícono.
- **Datos reales frente a ilustrativos.** `SourcesPanel` etiqueta cada fuente y `DataStatus` se muestra en los paneles.
- **Sin causalidad.** Hotspots, concientización, chat y diagnóstico incluyen una advertencia explícita.
- **Sin credenciales.** Ningún componente lee `GAMC_API_KEY` ni `AI_API_KEY`; solo llaman a rutas propias (`/api/...`).
- **Degradación elegante.** Si falta el backend, los paneles muestran fixtures locales o cálculos deterministas claramente etiquetados, además de estados de carga, error y vacío.

## Datos y fixtures

| Archivo | Contenido |
|---|---|
| `src/test/fixtures.ts` | Distritos, series, tendencias y equipamiento sintéticos para pruebas. |
| `analytics/hotspot-rules.ts` | Reglas deterministas de hotspots usadas solo como respaldo local del endpoint. |
| `analytics/methodology-data.ts` | Copia publicada de la metodología y resumen de calidad por año. |
| `analytics/source-catalog.ts` | Catálogo de fuentes alineado con `docs/05-FUENTES-DATOS.md`. |
| `src/test/setup.ts` | Polyfills de `ResizeObserver` y `matchMedia` para jsdom. |

Los fixtures **no son evidencia oficial**. Cualquier cifra usada en pruebas o en la vista de desarrollo debe conservar la etiqueta `illustrative` hasta que el pipeline publique datos reales.

## Pruebas

```bash
cd frontend
npm run typecheck
npm test
npm run build
npm run validate:mock
```

La vista de desarrollo se abre en `/dev3.html` y permite recorrer panel distrital, hotspots, metodología, fuentes, concientización y diagnóstico. El panel del copiloto se controla con `?panel=chat` y el distrito/año con `?district=` y `?year=`.
