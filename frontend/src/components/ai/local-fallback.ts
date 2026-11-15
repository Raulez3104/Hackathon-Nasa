import type { AIInsight, AIRequest, AIResponse, DistrictData, DistrictSeriesPoint } from "../../../../shared/types/geoqocha";
import {
  formatFractionPercent,
  formatIndex,
  formatLst,
  formatNdvi,
  formatPerCapita,
  trendDirectionLabel,
} from "../analytics/format";
import { latestSeriesPoint, seriesPointForYear, trendFor } from "../analytics/stats";
import { sourceLabel } from "../awareness/awareness-rules";

export const LOCAL_DISCLAIMER =
  "Respuesta por reglas local generada a partir de datos precalculados. No es una evaluación oficial del GAMC, no prioriza inversión pública y no implica causalidad.";

export const CHAT_SUGGESTIONS = [
  "¿Qué cubre el tablero GeoQocha?",
  "¿Cómo se comparan los distritos en ICVSA?",
  "¿Qué limitaciones tienen los datos?",
];

type ChatIntent =
  | "solutions"
  | "vegetation"
  | "temperature"
  | "equipment"
  | "mobility"
  | "population"
  | "hotspot"
  | "summary";

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

function detectIntent(question: string | undefined): ChatIntent {
  const text = (question ?? "").toLowerCase();
  if (/soluci|acci[oó]n|recomend|mitigar|reducir|mejorar|c[oó]mo hacer|qu[eé] hacer|estrategia|plan|interven/.test(text)) {
    return "solutions";
  }
  if (/ndvi|veget|deforest|verde|arbol|árbol/.test(text)) return "vegetation";
  if (/temperatura|calor|lst|superficial|isla de calor/.test(text)) return "temperature";
  if (/equip|escuela|salud|área verde|area verde|jardín|jardin|parque/.test(text)) return "equipment";
  if (/transporte|movilidad|parada|bus/.test(text)) return "mobility";
  if (/poblaci|habitante|demograf/.test(text)) return "population";
  if (/hotspot|prioridad|riesgo|alerta/.test(text)) return "hotspot";
  return "summary";
}

/** Sugerencias dinámicas: cambian según el distrito y sus señales ambientales. */
export function buildChatSuggestions(district: DistrictData | null, year: number | null): string[] {
  if (!district) return [...CHAT_SUGGESTIONS];

  const point = seriesPointForYear(district, year) ?? latestSeriesPoint(district);
  const name = district.name;
  const ndviTrend = trendFor(district, "ndvi");
  const lstTrend = trendFor(district, "lst");
  const suggestions: string[] = [];

  const ndviLow = point?.ndvi_mean != null && point.ndvi_mean < 0.35;
  if (ndviTrend?.direction === "worsening" || ndviLow) {
    suggestions.push(`¿Qué acciones podrían recuperar la vegetación en ${name}?`);
  } else {
    suggestions.push(`¿Cómo está la vegetación en ${name}?`);
  }

  const lstHigh = point?.lst_mean_celsius != null && point.lst_mean_celsius >= 30;
  if (lstHigh || lstTrend?.direction === "worsening") {
    suggestions.push(`¿Qué medidas reducirían el calor superficial en ${name}?`);
  } else {
    suggestions.push(`¿Qué muestra la temperatura superficial de ${name}?`);
  }

  const greenLow =
    district.equipment.green_area_m2_per_capita != null && district.equipment.green_area_m2_per_capita < 5;
  if (greenLow) {
    suggestions.push(`¿Cómo aumentar el área verde por habitante en ${name}?`);
  } else if (district.equipment.deficit_flags.length > 0) {
    suggestions.push(`¿Qué brechas de equipamiento muestra ${name}?`);
  } else {
    suggestions.push(`¿Qué datos territoriales debo considerar en ${name}?`);
  }

  if (district.latest_socioenvironmental_index != null && district.latest_socioenvironmental_index < 40) {
    suggestions.push(`¿Qué factores explican el ICVSA de ${name}?`);
  } else {
    suggestions.push(`¿Cómo se compara ${name} con el promedio municipal?`);
  }

  return suggestions.slice(0, 4);
}

function evidence(
  field: string,
  year: number | null,
  value: number | string | null,
  unit: string | null,
  sourceRef: string,
) {
  return { field, year, value, unit, source_ref: sourceRef || "unavailable" };
}

function solutionActions(
  district: DistrictData,
  point: DistrictSeriesPoint | null,
  ndviTrend: ReturnType<typeof trendFor>,
  lstTrend: ReturnType<typeof trendFor>,
): string[] {
  const actions: string[] = [];
  const ndvi = point?.ndvi_mean ?? null;
  const lst = point?.lst_mean_celsius ?? null;
  const green = district.equipment.green_area_m2_per_capita;
  const flags = district.equipment.deficit_flags;

  if (ndviTrend?.direction === "worsening" || (ndvi != null && ndvi < 0.35)) {
    actions.push(
      "Para la vegetación, conviene revisar las áreas con pérdida de vigor y evaluar la recuperación de cobertura con especies adecuadas a la zona.",
    );
  }
  if (lstTrend?.direction === "worsening" || (lst != null && lst >= 30)) {
    actions.push(
      "Para el calor superficial, conviene estudiar sombra urbana, arbolado y materiales de baja absorción térmica en las zonas más expuestas.",
    );
  }
  if (green != null && green < 5) {
    actions.push(
      "Para el déficit de área verde, conviene identificar espacios disponibles para parques o corredores verdes y coordinar su mantenimiento.",
    );
  }
  if (flags.some((flag) => /SCHOOLS|HEALTH|EQUIPMENT/.test(flag))) {
    actions.push(
      "Para el equipamiento, conviene revisar con el GAMC las brechas señaladas antes de definir cualquier intervención.",
    );
  }
  if (flags.some((flag) => /TRANSPORT|MOBILITY/.test(flag))) {
    actions.push(
      "Para la movilidad, conviene estudiar la cobertura de transporte y la conexión de los barrios periféricos.",
    );
  }
  if (actions.length === 0) {
    actions.push(
      "Con los datos disponibles no hay una señal de déficit específica; conviene mantener el monitoreo y revisar la metodología antes de proponer intervenciones.",
    );
  }

  actions.push("Estas son orientaciones cualitativas para el análisis, no una priorización oficial de inversión.");
  return actions;
}

/**
 * Genera una respuesta local por reglas cuando el endpoint no está
 * disponible. Solo repite hechos precalculados del dataset; no calcula
 * índices, hotspots ni prioridades.
 */
export function buildLocalResponse(
  request: AIRequest,
  district: DistrictData | null,
  districts: DistrictData[] = [],
): AIResponse {
  if (!district) {
    const match = /distrito\s*(?:municipal\s*)?(\d{1,2})/i.exec(request.question ?? "");
    const candidate = match ? districts.find((item) => item.district_id === Number(match[1])) : null;
    if (candidate) district = candidate;
  }

  const year = request.year ?? district?.latest_year ?? null;
  const point = district ? seriesPointForYear(district, year) ?? latestSeriesPoint(district) : null;
  const ndvi = point?.ndvi_mean ?? null;
  const lst = point?.lst_mean_celsius ?? null;
  const icvsa = point?.socioenvironmental_index ?? district?.latest_socioenvironmental_index ?? null;
  const environmental = point?.environmental_index ?? null;
  const ndviTrend = district ? trendFor(district, "ndvi") : null;
  const lstTrend = district ? trendFor(district, "lst") : null;
  const refYear = district?.territorial_reference_year ?? null;
  const refs = district?.source_refs ?? [];
  const primaryRef = refs[0] ?? "unavailable";
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

  if (!district) {
    const count = districts.length;
    const countText = count > 0 ? `${count} distritos` : "los distritos de Cochabamba";
    const answer = `El tablero reúne ${countText}. Sin un distrito seleccionado, el contexto es municipal: puedes consultar la cobertura, el periodo y las limitaciones de los datos, pero no cifras específicas de un distrito. Selecciona un distrito para consultar ICVSA, NDVI, LST, equipamiento y movilidad. ${LOCAL_DISCLAIMER}`;

    const insights: AIInsight[] = [
      {
        id: "local_municipal",
        kind: "observation",
        title: "Contexto municipal",
        body: `El tablero cubre ${countText}. El detalle socioambiental se consulta por distrito para no mezclar escalas.`,
        severity: "info",
        evidence: [],
      },
    ];

    return {
      request_id: "local_municipal",
      mode: request.mode,
      district_id: null,
      year,
      answer,
      insights,
      citations: [],
      disclaimer: LOCAL_DISCLAIMER,
      data_status: districts[0]?.data_status ?? "illustrative",
      model: null,
      generated_at: new Date().toISOString(),
      fallback_used: true,
    };
  }

  const intent = detectIntent(request.question);
  const flags = district.equipment.deficit_flags;
  const flagText = flags.length > 0 ? ` Señales de déficit: ${flags.join(", ")}.` : "";

  let answer: string;
  let insights: AIInsight[] = [];

  switch (intent) {
    case "vegetation":
      answer = `${name}, ${yearLabel(year)}. ${facts.join("; ")}.${trendText}${territorialText} La lectura es descriptiva y no implica causalidad.`;
      insights = [
        {
          id: "local_vegetation",
          kind: "observation",
          title: "Vegetación del distrito",
          body: `NDVI medio ${formatNdvi(ndvi)}.${trendText}`,
          severity: "info",
          evidence: [
            evidence("ndvi_mean", year, ndvi, "índice", primaryRef),
            evidence("trend_ndvi_slope_per_year", null, ndviTrend?.slope_per_year ?? null, ndviTrend?.unit ?? null, primaryRef),
          ],
        },
      ];
      break;
    case "temperature":
      answer = `${name}, ${yearLabel(year)}. La temperatura superficial media es ${formatLst(lst)}.${lstTrend ? ` La tendencia de LST es «${trendDirectionLabel(lstTrend.direction).toLowerCase()}».` : ""}${territorialText} La lectura es descriptiva y no implica causalidad.`;
      insights = [
        {
          id: "local_temperature",
          kind: "observation",
          title: "Temperatura superficial",
          body: `LST media ${formatLst(lst)}.${lstTrend ? ` Tendencia ${trendDirectionLabel(lstTrend.direction).toLowerCase()}.` : ""}`,
          severity: "info",
          evidence: [
            evidence("lst_mean_celsius", year, lst, "°C", primaryRef),
            evidence("trend_lst_slope_per_year", null, lstTrend?.slope_per_year ?? null, lstTrend?.unit ?? null, primaryRef),
          ],
        },
      ];
      break;
    case "equipment":
      answer = `${name}, ${yearLabel(year)}. El área verde por habitante es ${formatPerCapita(district.equipment.green_area_m2_per_capita)}; el índice de acceso a equipamiento es ${formatIndex(district.equipment.equipment_access_index)} de 100.${flagText}${territorialText} La lectura es descriptiva y no implica causalidad.`;
      insights = [
        {
          id: "local_equipment",
          kind: "observation",
          title: "Equipamiento y área verde",
          body: `Área verde ${formatPerCapita(district.equipment.green_area_m2_per_capita)}; acceso a equipamiento ${formatIndex(district.equipment.equipment_access_index)} de 100.${flagText}`,
          severity: flags.length > 0 ? "warning" : "info",
          evidence: [
            evidence("green_area_m2_per_capita", refYear, district.equipment.green_area_m2_per_capita, "m²/habitante", primaryRef),
            evidence("equipment_access_index", refYear, district.equipment.equipment_access_index, "índice 1–100", primaryRef),
            evidence("deficit_flags", refYear, flags.join(", ") || null, null, primaryRef),
          ],
        },
      ];
      break;
    case "mobility":
      answer = `${name}, ${yearLabel(year)}. La cobertura de transporte es ${formatFractionPercent(district.equipment.transport_coverage_fraction)} y el índice de acceso a movilidad es ${formatIndex(district.equipment.mobility_access_index)} de 100.${territorialText} La lectura es descriptiva y no implica causalidad.`;
      insights = [
        {
          id: "local_mobility",
          kind: "observation",
          title: "Movilidad",
          body: `Cobertura de transporte ${formatFractionPercent(district.equipment.transport_coverage_fraction)}; acceso a movilidad ${formatIndex(district.equipment.mobility_access_index)} de 100.`,
          severity: "info",
          evidence: [
            evidence("transport_coverage_fraction", refYear, district.equipment.transport_coverage_fraction, "fracción 0–1", primaryRef),
            evidence("mobility_access_index", refYear, district.equipment.mobility_access_index, "índice 1–100", primaryRef),
          ],
        },
      ];
      break;
    case "population":
      answer = `${name}, ${yearLabel(year)}. La población es ${district.population ?? "no disponible"} habitantes (${district.population_year ?? "año no declarado"}) y la superficie es ${district.area_km2 ?? "no disponible"} km².${territorialText} La lectura es descriptiva y no implica causalidad.`;
      insights = [
        {
          id: "local_population",
          kind: "observation",
          title: "Población y superficie",
          body: `Población ${district.population ?? "no disponible"} habitantes; superficie ${district.area_km2 ?? "no disponible"} km².`,
          severity: "info",
          evidence: [
            evidence("population", district.population_year, district.population, "habitantes", primaryRef),
            evidence("area_km2", null, district.area_km2, "km²", primaryRef),
          ],
        },
      ];
      break;
    case "hotspot":
      answer = `${name}, ${yearLabel(year)}. La vista del copiloto no recibe un puntaje de hotspot precalculado; el riesgo declarado del distrito es «${district.risk_level}» y el ICVSA es ${formatIndex(icvsa)} de 100. Revisa la pestaña Hotspots para el detalle de las reglas activadas.${territorialText} La lectura es descriptiva y no implica causalidad.`;
      insights = [
        {
          id: "local_hotspot",
          kind: "risk",
          title: "Riesgo declarado",
          body: `Riesgo «${district.risk_level}» e ICVSA ${formatIndex(icvsa)} de 100. El detalle de hotspot está en la pestaña correspondiente.`,
          severity: district.risk_level === "high" ? "critical" : district.risk_level === "medium" ? "warning" : "info",
          evidence: [
            evidence("socioenvironmental_index", year, icvsa, "índice 1–100", primaryRef),
          ],
        },
      ];
      break;
    case "solutions": {
      const actions = solutionActions(district, point, ndviTrend, lstTrend);
      answer = `${name}, ${yearLabel(year)}. ${facts.join("; ")}.${flagText} ${actions.join(" ")}${territorialText} La lectura es descriptiva y no implica causalidad.`;
      insights = [
        {
          id: "local_recommendation",
          kind: "recommendation",
          title: "Orientaciones para el análisis",
          body: actions.join(" "),
          severity: flags.length > 0 ? "warning" : "info",
          evidence: [
            evidence("ndvi_mean", year, ndvi, "índice", primaryRef),
            evidence("lst_mean_celsius", year, lst, "°C", primaryRef),
            evidence("green_area_m2_per_capita", refYear, district.equipment.green_area_m2_per_capita, "m²/habitante", primaryRef),
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
            evidence("territorial_reference_year", refYear, refYear, "año", refs[1] ?? primaryRef),
          ],
        },
      ];
      break;
    }
    default:
      answer = `${name}, ${yearLabel(year)}. ${facts.join("; ")}.${trendText}${territorialText} No encontré una categoría específica para tu pregunta, así que resumo los hechos disponibles del distrito. La lectura es descriptiva y no implica causalidad.`;
      insights = [
        {
          id: "local_observation",
          kind: "observation",
          title: "Lectura del distrito",
          body: `${facts.join("; ")}.${trendText}`,
          severity: "info",
          evidence: [
            evidence("socioenvironmental_index", year, icvsa, "índice 1–100", primaryRef),
            evidence("environmental_index", year, environmental, "índice 1–100", primaryRef),
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
            evidence("territorial_reference_year", refYear, refYear, "año", refs[1] ?? primaryRef),
          ],
        },
      ];
  }

  const citations = [
    citationFor(primaryRef, intent === "temperature" ? "lst_mean_celsius" : "ndvi_mean", year),
    ...(refYear != null ? [citationFor(refs[1] ?? primaryRef, "territorial_reference_year", refYear)] : []),
  ];

  return {
    request_id: `local_${district.district_id}_${year ?? "na"}`,
    mode: request.mode,
    district_id: district.district_id,
    year,
    answer,
    insights,
    citations,
    disclaimer: LOCAL_DISCLAIMER,
    data_status: district.data_status,
    model: null,
    generated_at: new Date().toISOString(),
    fallback_used: true,
  };
}

export function latestYearOf(district: DistrictData | null): number | null {
  return district?.latest_year ?? district?.series[district.series.length - 1]?.year ?? null;
}
