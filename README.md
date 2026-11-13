# Cochabamba Verde

## Observatorio socioambiental de los 15 distritos de Cochabamba

Cochabamba Verde es una plataforma web de código abierto para explorar y comparar las condiciones socioambientales de los 15 distritos municipales de Cochabamba. Integra observaciones satelitales de NASA con datos geoespaciales del Gobierno Autónomo Municipal de Cochabamba (GAMC).

> Estado actual: andamiaje inicial del frontend, landing page y backend base con `/api/health`. El pipeline de datos y el tablero analítico todavía están pendientes.

## Qué busca resolver

- Visualizar NDVI y temperatura superficial (LST) entre 2015 y 2025.
- Comparar distritos y detectar brechas territoriales.
- Integrar capas de áreas verdes, equipamiento, salud, educación y transporte.
- Construir un ICVSA histórico de 1 a 100 con metodología pública.
- Identificar hotspots ambientales y de déficit de equipamiento mediante reglas explicables.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React, TypeScript, Vite |
| Estilos | CSS; Tailwind CSS previsto en la arquitectura |
| Mapas | Leaflet y React Leaflet |
| Gráficos | Recharts |
| Backend | Node.js, Express y TypeScript |
| Datos | Python y/o Google Earth Engine |
| Persistencia MVP | JSON, CSV y GeoJSON |
| Persistencia futura | PostgreSQL y PostGIS |

## Estructura

```text
frontend/       # Aplicación React + Vite y landing page
backend/        # API Express y proxy seguro para GAMC
data-processing/ # Pipeline NASA/GIS (pendiente de implementar)
data/           # Geometrías, datos procesados y metadatos
docs/           # Especificación funcional y técnica
AGENTS.md       # Guía de trabajo para agentes y colaboradores
MEMORY.md       # Decisiones y estado del proyecto
```

## Ejecutar el frontend

```bash
cd frontend
npm install
npm run dev
```

La landing page estará disponible en `http://localhost:5173`.

## Ejecutar el backend

En otra terminal:

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
npm install
npm run dev
```

El endpoint de salud estará disponible en `http://localhost:3000/api/health`.

Las credenciales del GAMC deben permanecer únicamente en el `.env` del backend. Nunca deben incluirse en el frontend, en Git ni en la documentación.

## Documentación

La documentación completa está en [`docs/README.md`](./docs/README.md).

- [Proyecto y objetivos](./docs/01-PROYECTO.md)
- [Requerimientos](./docs/02-REQUERIMIENTOS.md)
- [Arquitectura](./docs/03-ARQUITECTURA.md)
- [Contratos API](./docs/04-CONTRATOS-API.md)
- [Fuentes de datos](./docs/05-FUENTES-DATOS.md)
- [Plan de desarrollo](./docs/06-PLAN-DESARROLLO.md)

## Equipo de desarrollo

El plan está dimensionado para tres desarrolladores de sistemas:

- **S1:** backend, API, integración y despliegue.
- **S2:** frontend, mapas y visualización.
- **S3:** datos, GIS y procesamiento NASA.

## Fuentes principales

- NASA MOD13Q1, colección 6.1: NDVI.
- NASA MOD11A2, colección 6.1: LST.
- [Documentación GAMC](https://recursosgamc.cochabamba.bo/api-doc).
- [Servicio WMS GAMC](https://serviciosgamc.cochabamba.bo/api/gs/wms).

Los datos municipales y satelitales deben validarse antes de publicar resultados. Los valores de ejemplo en los contratos son ficticios.

## Licencia

El código se distribuye bajo licencia [MIT](./LICENSE). La documentación del proyecto se propone bajo CC BY 4.0, siempre que las licencias de las fuentes de terceros lo permitan.
