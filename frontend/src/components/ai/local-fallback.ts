import type { AIRequest, AIResponse, DistrictData } from "../../../../shared/types/geoqocha";
import { formatIndex, formatLst, formatNdvi, trendDirectionLabel } from "../analytics/format";
import { latestSeriesPoint, trendFor } from "../analytics/stats";
import { sourceLabel } from "../awareness/awareness-rules";

export const LOCAL_DISCLAIMER =
  "Respuesta por reglas local generada a partir de datos precalculados. No es una evaluación oficial del GAMC, no prioriza inversión pública y no implica causalidad.";

export const CHAT_SUGGESTIONS = [
  "¿Cómo está la vegetación en este distrito?",
  "¿Qué muestra la temperatura superficial?",
  "¿Qué datos territoriales debo tener en cuenta?",
];

function citationFor(ref: string, field: string | undefined, year: number | null) {
  return {
    source_ref: ref || "unavailable",
    label: ref ? sourceLabel(ref) : "Sin fuente declarada",
    ...(field ? { field } : {}),
    ...(year != null ? { year } : {}),
  };
}

function yearLabel(year: number | null): string {
  return year != null ? String(year) : "el último año disponible";
}

/**
 * Genera una respuesta local por reglas cuando el endpoint no está
 * disponible. Solo repite hechos precalculados del dataset; no calcula
 * índices, hotspots ni prioridades.
 */
export function buildLocalResponse(request: AIRequest, district: DistrictData | null): AIResponse {
  const year = request.year ?? district?.latest_year ?? null;
  const point = district ? latestSeriesPoint(district) : null;
  const ndvi = point?.ndvi_mean ?? null;
  const lst = point?.lst_mean_celsius ?? null;
  const icvsa = point?.socioenvironmental_index ?? district?.latest_socioenvironmental_index ?? null;
  const ndviTrend = district ? trendFor(district, "ndvi") : null;
  const refYear = district?.territorial_reference_year ?? null;
  const name = district?.name ?? "el distrito seleccionado";

  const facts: string[] = [
    `ICVSA: ${formatIndex(icvsa)} de 100`,
    `NDVI medio: ${formatNdvi(ndvi)}`,
    `LST media: ${formatLst(lst)}`,
  ];

  const trendText = ndviTrend
    ? ` La tendencia declarada de NDVI es «${trendDirectionLabel(ndviTrend.direction).toLowerCase()}».`
    : "";

  const territorialText =
    refYear != null
      ? ` El componente territorial (equipamiento y movilidad) usa datos de ${refYear} y no se interpola a otros años.`
      : " No hay año de referencia territorial declarado.";

  const answer = district
    ? `${name}, ${yearLabel(year)}. ${facts.join("; ")}.${trendText}${territorialText} La lectura es descriptiva y no implica causalidad.`
    : `No hay un distrito seleccionado, por lo que no puedo citar cifras del dataset. ${LOCAL_DISCLAIMER}`;

  const refs = district?.source_refs ?? [];
  const citations = [
    citationFor(refs[0] ?? "", district ? "ndvi_mean" : undefined, year),
    ...(refYear != null ? [citationFor(refs[1] ?? refs[0] ?? "", "territorial_reference_year", refYear)] : []),
  ];

  return {
    request_id: `local_${district?.district_id ?? 0}_${year ?? "na"}`,
    mode: request.mode,
    district_id: district?.district_id ?? null,
    year,
    answer,
    insights: district
      ? [
          {
            id: "local_observation",
            kind: "observation",
            title: "Lectura del distrito",
            body: `${facts.join("; ")}.${trendText}`,
            severity: "info",
            evidence: [
              {
                field: "socioenvironmental_index",
                year,
                value: icvsa,
                unit: "índice 1–100",
                source_ref: refs[0] ?? "unavailable",
              },
            ],
          },
          {
            id: "local_caveat",
            kind: "caveat",
            title: "Datos territoriales fijos",
            body:
              refYear != null
                ? `Equipamiento y movilidad corresponden a ${refYear}; no se extrapolan a otros años.`
                : "El dataset no declara año de referencia territorial.",
            severity: "warning",
            evidence: [
              {
                field: "territorial_reference_year",
                year: refYear,
                value: refYear,
                unit: "año",
                source_ref: refs[1] ?? refs[0] ?? "unavailable",
              },
            ],
          },
        ]
      : [],
    citations,
    disclaimer: LOCAL_DISCLAIMER,
    data_status: district?.data_status ?? "illustrative",
    model: null,
    generated_at: new Date().toISOString(),
    fallback_used: true,
  };
}

export function latestYearOf(district: DistrictData | null): number | null {
  return district?.latest_year ?? district?.series[district.series.length - 1]?.year ?? null;
}
