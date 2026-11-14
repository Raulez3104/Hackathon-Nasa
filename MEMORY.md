# MEMORY.md — Memoria compartida de GeoQocha

Registro breve y versionado de decisiones, estado y pendientes del proyecto.

## Reglas de mantenimiento

- La documentación detallada y la matriz de tareas viven en `docs/`; este archivo solo resume.
- **DEV1 es el único responsable de actualizar este archivo** después de un merge o cuando cambie una decisión general.
- DEV2 y DEV3 usan `MEMORY.local.md` para sus notas personales; ese archivo no se versiona.
- No registrar aquí detalles temporales de una sesión ni duplicar contratos completos.
- Una decisión nueva se agrega con el siguiente identificador `D-xx`; no se borran decisiones reemplazadas.

## Estado actual

| Aspecto | Estado |
|---|---|
| Producto | GeoQocha: tablero socioambiental para los 15 distritos de Cochabamba |
| Contrato | `shared/types/geoqocha.ts`, versión `0.1.0` |
| Tag de contrato | `contract-v0.1.0` apunta al commit del Día 0 en `main` |
| Mock | `frontend/public/data/mock_distritos.json`, ilustrativo, 15 distritos, 2015–2025 |
| Ramas oficiales | `dev1`, `dev2`, `dev3`, permanentes y con PR hacia `main` |
| Flujo de integración | PR, una aprobación mínima, sincronización con `git merge origin/main` |
| Frontend | React + Vite + TypeScript + Leaflet + Tailwind v4 cableado |
| Backend | Node.js + Express + TypeScript; actualmente solo healthcheck |
| Datos reales | No generados; el mock sigue siendo la fuente de desarrollo |
| CI | No hay workflow; cada PR declara typecheck, build y validación del mock |

## Decisiones vigentes

| ID | Decisión | Referencia |
|---|---|---|
| D-01 | ICVSA histórico 2015–2025, escala 1–100 | `docs/02` §7.1 |
| D-02 | Pesos: 35 % NDVI, 35 % LST, 20 % equipamiento, 10 % movilidad | `docs/02` RN-02/RN-03 |
| D-03 | Equipamiento y movilidad usan `territorial_reference_year` | `docs/02` RN-09 |
| D-04 | `index_without_territorial` publica sensibilidad sin componente territorial | `docs/02` RN-10 |
| D-05 | Semáforo como vista alternativa: verde 70–100, amarillo 40–69, rojo 1–39 | `docs/02` RN-01/RF-37 |
| D-06 | Cálculos municipales vector-first; WMS solo visualización | `docs/03` AD-04 |
| D-07 | Todo acceso WMS pasa por proxy backend con lista blanca | `docs/03` AD-01 |
| D-08 | Persistencia MVP en JSON/GeoJSON, sin base de datos | `docs/03` AD-02 |
| D-09 | Hotspots con reglas explicables, incluido déficit territorial | `docs/02` RN-11 |
| D-10 | Correlación exploratoria, con `n`, sin causalidad; no calcular si `n < 8` | `docs/02` RN-14/RN-20 |
| D-11 | Alcance cerrado para tres desarrolladores: DEV1, DEV2 y DEV3 | `docs/06` §1/§6 |
| D-12 | P0 obligatorio; P1 solo si sobra tiempo; P2 posterior | `docs/06` §2 |
| D-13 | IA solo redacta hechos precalculados, con citas y fallback | `docs/03` AD-05 |
| D-14 | Mapas de calor precalculados por el pipeline | `docs/03` AD-07 |
| D-15 | `null` significa no disponible; nunca cero ni imputación | `docs/02` RN-07/RN-23 |
| D-16 | Código MIT; documentación CC BY 4.0 | `docs/05` §6 |
| D-17 | GeoQocha reemplaza a Cochabamba Verde | `docs/01` |
| D-18 | React + Vite y Node.js + Express en monorepo | `docs/03` AD-09 |
| D-19 | Ramas permanentes `dev1`/`dev2`/`dev3`; integración periódica por PR | `docs/06` §5/§9 |
| D-20 | Paradas de transporte son propuestas ilustrativas hasta validación oficial | `docs/03` AD-11 |
| D-21 | Cualquier desarrollador puede modificar dependencias; debe incluir package y lockfile coherentes | `docs/06` §5.2 |
| D-22 | No se usa rama `contract/*`; cambios de contrato requieren aprobación de los tres | `docs/06` §3.1/§5.3 |

## Fuentes de verdad

- Alcance y prioridad: `docs/02-REQUERIMIENTOS.md`.
- Arquitectura: `docs/03-ARQUITECTURA.md`.
- Tipos, endpoints y respuestas: `docs/04-CONTRATOS-API.md`.
- Fuentes y limitaciones: `docs/05-FUENTES-DATOS.md`.
- Tareas, ramas y matriz de avance: `docs/06-PLAN-DESARROLLO.md`.
- Código compartido: `shared/types/geoqocha.ts`.
- Mock: `frontend/public/data/mock_distritos.json`.

## Próximos pasos

1. Crear y publicar `dev1`, `dev2` y `dev3` desde `main`.
2. DEV1 implementar T1-01: `data-source.ts`, shell del mapa, coropletas, semáforo y mapa de calor LST.
3. DEV2 iniciar T2-01: esqueleto y validación del pipeline.
4. DEV3 iniciar T3-01: panel distrital y comparador.
5. Cada PR debe declarar tarea, archivos, impacto en contrato y pruebas ejecutadas.

## Bitácora

| Fecha | Cambio |
|---|---|
| 2026-11-13 | Se congeló el contrato Día 0 con el tag `contract-v0.1.0`. |
| 2026-11-13 | Se definieron las ramas permanentes `dev1`, `dev2` y `dev3`, con PR hacia `main`. |
| 2026-11-13 | Se cableó Tailwind v4 y se agregaron tokens visuales base del dashboard. |
| 2026-11-13 | Se separó la memoria compartida de las notas locales mediante `MEMORY.local.md`. |
