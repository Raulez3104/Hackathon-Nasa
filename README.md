# GeoQocha

## Tablero satelital de inteligencia territorial y calidad de vida

GeoQocha es una plataforma web de código abierto para explorar y comparar las condiciones socioambientales de los 15 distritos municipales de Cochabamba. Integra observaciones satelitales de NASA, datos geoespaciales del Gobierno Autónomo Municipal de Cochabamba (GAMC) y un copiloto de IA que explica los datos con citas.

> Estado actual: documentación actualizada al plan GeoQocha. El MVP usa un monorepo con frontend React + Vite y backend Node.js + Express; el mock compartido y el contrato de tipos se crean en el Día 0. El pipeline de datos reales todavía está pendiente.

## Qué busca resolver

- Visualizar NDVI y temperatura superficial (LST) entre 2015 y 2025.
- Comparar distritos y detectar brechas territoriales.
- Integrar capas de áreas verdes, equipamiento, salud, educación y transporte.
- Construir un ICVSA histórico de 1 a 100 con metodología pública.
- Identificar hotspots ambientales y de déficit de equipamiento mediante reglas explicables.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React, Vite, TypeScript |
| Estilos | Tailwind CSS |
| Mapas | Leaflet y React Leaflet |
| Gráficos | Recharts |
| Backend | Node.js, Express y TypeScript |
| IA | Gemini u OpenAI con RAG ligero sobre JSON |
| Datos | Python y/o Google Earth Engine |
| Persistencia MVP | JSON y GeoJSON |
| Persistencia futura | PostgreSQL y PostGIS |

## Estructura

```text
frontend/       # Aplicación React + Vite
backend/        # API Node.js + Express
shared/         # Tipos compartidos entre frontend y backend
frontend/public/data/ # Mock y dataset real servidos al frontend
scripts/        # Pipeline NASA/GIS en Python
data/           # Geometrías, datos procesados y metadatos
docs/           # Especificación funcional y técnica
AGENTS.md       # Guía de trabajo para agentes y colaboradores
MEMORY.md       # Decisiones y estado del proyecto
```

## Ejecutar la aplicación

```bash
cd frontend && npm install
cd ../backend && npm install
# Ejecutar frontend y backend en terminales separadas
npm run dev
```

El frontend estará disponible en `http://localhost:5173`. La API Express y su endpoint de salud estarán en `http://localhost:3001/api/health`.

Las credenciales del GAMC y del proveedor de IA deben permanecer únicamente en el `.env` del servidor. Nunca deben incluirse en el cliente, en Git ni en la documentación.

## Modo de datos

- `VITE_DATA_MODE=mock` usa el mock, etiquetado como ilustrativo.
- `VITE_DATA_MODE=real` usa `distritos_data.json`, generado por el pipeline.
- Si el archivo real no existe, la aplicación vuelve al mock con una etiqueta visible.

## Documentación

La documentación completa está en [`docs/README.md`](./docs/README.md).

- [Proyecto y objetivos](./docs/01-PROYECTO.md)
- [Requerimientos](./docs/02-REQUERIMIENTOS.md)
- [Arquitectura](./docs/03-ARQUITECTURA.md)
- [Contratos API](./docs/04-CONTRATOS-API.md)
- [Fuentes de datos](./docs/05-FUENTES-DATOS.md)
- [Plan de desarrollo](./docs/06-PLAN-DESARROLLO.md)

## Equipo de desarrollo

El plan está dimensionado para tres desarrolladores de sistemas con frentes independientes:

- **DEV1:** mapas, WMS del GAMC y movilidad urbana.
- **DEV2:** datos NASA, pipeline y backend de IA.
- **DEV3:** analítica, concientización y chat UI.

## Fuentes principales

- NASA MOD13Q1, colección 6.1: NDVI.
- NASA MOD11A2, colección 6.1: LST.
- [Documentación GAMC](https://recursosgamc.cochabamba.bo/api-doc).
- [Servicio WMS GAMC](https://serviciosgamc.cochabamba.bo/api/gs/wms).
- [Google AI (Gemini)](https://ai.google.dev/).
- [OpenAI Platform](https://platform.openai.com/docs).

Los datos municipales y satelitales deben validarse antes de publicar resultados. Los valores de ejemplo en los contratos y el mock son ficticios. La IA solo explica hechos precalculados y nunca sustituye la metodología del ICVSA.

## Licencia

El código se distribuye bajo licencia [MIT](./LICENSE). La documentación del proyecto se propone bajo CC BY 4.0, siempre que las licencias de las fuentes de terceros lo permitan.
