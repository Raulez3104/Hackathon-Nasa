# Documentación de GeoQocha

Esta carpeta contiene la especificación funcional, técnica y metodológica vigente del proyecto.

## Orden recomendado de lectura

| Orden | Documento | Contenido |
|---:|---|---|
| 1 | [`01-PROYECTO.md`](./01-PROYECTO.md) | Problema, objetivos, usuarios y propuesta de valor |
| 2 | [`02-REQUERIMIENTOS.md`](./02-REQUERIMIENTOS.md) | Funcionalidades, prioridades, reglas y aceptación |
| 3 | [`03-ARQUITECTURA.md`](./03-ARQUITECTURA.md) | Stack, componentes, flujos y decisiones técnicas |
| 4 | [`04-CONTRATOS-API.md`](./04-CONTRATOS-API.md) | Tipos, campos, endpoints y respuestas |
| 5 | [`05-FUENTES-DATOS.md`](./05-FUENTES-DATOS.md) | NASA, GAMC, datos derivados, licencias y validación |
| 6 | [`06-PLAN-DESARROLLO.md`](./06-PLAN-DESARROLLO.md) | Cronograma, roles, backlog, riesgos y demo |

## Estado de la documentación

- ICVSA histórico 2015–2025 definido con `territorial_reference_year` (`t_ref`).
- NDVI y LST establecidos como variables satelitales principales.
- Estrategia vector-first para las capas municipales del GAMC.
- Proxy backend obligatorio para no exponer credenciales.
- Contratos API definidos antes de implementar endpoints.
- Plan ajustado a tres desarrolladores de sistemas con frentes independientes.
- Stack objetivo: Next.js + TypeScript + Tailwind, con route handlers para WMS e IA.
- Copiloto IA acotado: RAG sobre datos precalculados, citas y fallback por reglas.
- Contrato compartido y mock definidos para el Día 0.
- Código inicial legado: landing page React + Vite y backend Express con `/api/health`; se migra a Next.js.
- Resultados distritales reales: todavía no generados.

## Reglas de mantenimiento

1. `02-REQUERIMIENTOS.md` define el alcance y las prioridades.
2. `04-CONTRATOS-API.md` es la fuente de verdad para campos y respuestas API.
3. `03-ARQUITECTURA.md` define la infraestructura y las decisiones técnicas.
4. Cualquier cambio de código que modifique el contrato debe actualizar `04` en el mismo cambio.
5. No se publican credenciales, datos crudos pesados ni resultados ficticios como si fueran reales.
6. Las decisiones importantes se registran en [`../MEMORY.md`](../MEMORY.md).

## Licencias

- Código: MIT, ver [`../LICENSE`](../LICENSE).
- Documentación: propuesta CC BY 4.0, sujeta a las licencias de las fuentes de terceros.
- Datos GAMC y NASA: conservar sus atribuciones y condiciones de uso correspondientes.
