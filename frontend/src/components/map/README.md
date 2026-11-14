# Mapa, WMS y transporte

## Variables de entorno

```dotenv
VITE_API_BASE_URL=http://localhost:3000
VITE_DATA_MODE=mock
```

El frontend nunca recibe `GAMC_API_KEY`. Las capas municipales se solicitan
exclusivamente mediante `GET /api/gamc/wms` y el backend agrega la credencial.

## Capas municipales

El catálogo permite activar/desactivar capas GAMC, ajustar opacidad, consultar
atributos y reintentar una capa degradada. El WMS es visualización; no se
calculan áreas, conteos ni accesibilidad desde píxeles.

## Transporte

`TransportLayer` carga `frontend/public/data/transport.geojson`, filtra por
ruta (agrupada por el nombre del archivo `.geojson`) y distrito y muestra las
líneas. Las paradas propuestas son opcionales, se cargan desde zoom 14 para
evitar saturar el mapa y son ilustrativas, no oficiales ni calificaciones de
seguridad.

## Verificación

```powershell
cd frontend
npm run typecheck
npm test -- --run
npm run build
```

El proxy WMS se verifica desde `backend/` con:

```powershell
npm run typecheck
npm run build
```
