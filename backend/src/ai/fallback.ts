import type { AIContext, AIDraft, AIDraftInsight } from "./types.js";

type Numeric = number | null;

function valueOf(context: AIContext, field: string, year?: number | null): number | string | null {
  const fact =
    context.facts.find((item) => item.field === field && (year === undefined || year === null || item.year === year)) ??
    context.facts.find((item) => item.field === field);
  return fact?.value ?? null;
}

function numeric(context: AIContext, field: string): Numeric {
  const value = valueOf(context, field);
  return typeof value === "number" ? value : null;
}

function text(context: AIContext, field: string): string | null {
  const value = valueOf(context, field);
  return typeof value === "string" ? value : null;
}

function fmt(value: Numeric, digits = 1): string {
  return value === null ? "no disponible" : value.toFixed(digits);
}

function conditionLabel(index: number | null): string {
  if (index === null) return "sin dato suficiente";
  if (index >= 70) return "relativamente favorable";
  if (index >= 40) return "intermedia";
  return "de atención";
}

function directionLabel(direction: string): string {
  const labels: Record<string, string> = {
    improving: "mejorando",
    stable: "estable",
    worsening: "empeorando",
    undetermined: "indeterminada",
  };
  return labels[direction] ?? direction;
}

function trend(context: AIContext, variable: string) {
  return context.trends.find((item) => item.variable === variable) ?? null;
}

function evidence(context: AIContext, field: string, year: number | null = null) {
  const fact =
    context.facts.find((item) => item.field === field && (year === null || item.year === year)) ??
    context.facts.find((item) => item.field === field);
  if (!fact) return null;
  return { field: fact.field, year: fact.year, source_ref: fact.source_ref };
}

function buildInsight(
  context: AIContext,
  kind: AIDraftInsight["kind"],
  title: string,
  body: string,
  severity: AIDraftInsight["severity"],
  fields: Array<[string, number | null]>,
): AIDraftInsight {
  const facts = fields
    .map(([field, year]) => evidence(context, field, year))
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return { kind, title, body, severity, evidence: facts };
}

function vegetationSentence(context: AIContext): string {
  const ndvi = numeric(context, "ndvi_mean");
  const trendValue = trend(context, "ndvi");
  const parts = [`El NDVI del año es ${fmt(ndvi, 2)}.`];
  if (trendValue && trendValue.slope_per_year !== null) {
    parts.push(
      `La tendencia de NDVI es ${directionLabel(trendValue.direction)} con una pendiente de ${fmt(trendValue.slope_per_year, 3)} por año.`,
    );
  }
  return parts.join(" ");
}

function temperatureSentence(context: AIContext): string {
  const lst = numeric(context, "lst_mean_celsius");
  const trendValue = trend(context, "lst");
  const parts = [`La temperatura superficial media es ${fmt(lst, 1)} °C.`];
  if (trendValue && trendValue.slope_per_year !== null) {
    parts.push(
      `La tendencia de LST es ${directionLabel(trendValue.direction)} con una pendiente de ${fmt(trendValue.slope_per_year, 2)} °C por año.`,
    );
  }
  return parts.join(" ");
}

function populationSentence(context: AIContext): string {
  const population = numeric(context, "population");
  const populationYear = numeric(context, "population_year");
  const area = numeric(context, "area_km2");
  return `La población es ${fmt(population, 0)} habitantes (${populationYear === null ? "año no declarado" : populationYear}) y la superficie es ${fmt(area, 1)} km².`;
}

function equipmentSentence(context: AIContext): string {
  const green = numeric(context, "green_area_m2_per_capita");
  const schools = numeric(context, "schools_per_1000");
  const health = numeric(context, "health_centers_per_1000");
  const access = numeric(context, "equipment_access_index");
  const flags = text(context, "deficit_flags");
  const base = `El área verde por habitante es ${fmt(green, 1)} m², hay ${fmt(schools, 2)} escuelas y ${fmt(health, 2)} centros de salud por 1000 habitantes; el índice de acceso a equipamiento es ${fmt(access, 1)}.`;
  return flags ? `${base} Señales de déficit: ${flags}.` : base;
}

function mobilitySentence(context: AIContext): string {
  const coverage = numeric(context, "transport_coverage_fraction");
  const access = numeric(context, "mobility_access_index");
  return `La cobertura de transporte es ${fmt(coverage, 2)} y el índice de acceso a movilidad es ${fmt(access, 1)}.`;
}

function hotspotSentence(context: AIContext): string {
  if (!context.hotspot) return "No hay hotspot calculado para este distrito.";
  if (context.hotspot.score === null) return "No hay datos suficientes para el puntaje de hotspot.";
  const active = context.hotspot.rules.filter((rule) => rule.triggered).map((rule) => rule.rule_id);
  const rules = active.length > 0 ? ` Reglas activadas: ${active.join(", ")}.` : " No se activaron reglas.";
  return `El puntaje de hotspot es ${fmt(context.hotspot.score, 1)} con prioridad ${context.hotspot.priority_level}.${rules}`;
}

function territorialCaveat(context: AIContext): string {
  return `El componente territorial corresponde al año de referencia ${context.district?.territorial_reference_year ?? "no declarado"} y no se interpola.`;
}

function statusCaveat(context: AIContext): string {
  return context.data_status === "illustrative"
    ? "Los datos son ilustrativos y no representan mediciones oficiales."
    : "Los datos provienen de las fuentes declaradas en el catálogo.";
}

function buildCitations(context: AIContext, insights: AIDraftInsight[]) {
  const citations: AIDraft["citations"] = [];
  const seen = new Set<string>();
  for (const insight of insights) {
    for (const item of insight.evidence) {
      const key = `${item.source_ref}-${item.field}-${item.year ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      citations.push({ source_ref: item.source_ref, field: item.field, year: item.year ?? undefined });
    }
  }
  return citations;
}

function diagnosisDraft(context: AIContext): AIDraft {
  const districtName = context.district?.name ?? "El distrito";
  const index = numeric(context, "socioenvironmental_index");
  const environmental = numeric(context, "environmental_index");
  const ndviTrend = trend(context, "ndvi");
  const lstTrend = trend(context, "lst");
  const hotspot = context.hotspot;

  const answer = [
    `${districtName} presenta una condición ${conditionLabel(index)} con un ICVSA de ${fmt(index, 1)} en ${context.request.year}.`,
    populationSentence(context),
    vegetationSentence(context),
    temperatureSentence(context),
    equipmentSentence(context),
    mobilitySentence(context),
    hotspotSentence(context),
    territorialCaveat(context),
    statusCaveat(context),
    "La lectura es descriptiva y no implica causalidad.",
  ].join(" ");

  const insights: AIDraftInsight[] = [
    buildInsight(
      context,
      "observation",
      "Condición ambiental del año",
      `NDVI ${fmt(numeric(context, "ndvi_mean"), 2)} y LST ${fmt(numeric(context, "lst_mean_celsius"), 1)} °C; índice ambiental ${fmt(environmental, 1)}.`,
      "info",
      [
        ["ndvi_mean", context.request.year],
        ["lst_mean_celsius", context.request.year],
        ["environmental_index", context.request.year],
      ],
    ),
  ];

  if (ndviTrend) {
    insights.push(
      buildInsight(
        context,
        "observation",
        "Tendencia de vegetación",
        `La tendencia de NDVI es ${directionLabel(ndviTrend.direction)}.`,
        ndviTrend.direction === "worsening" ? "warning" : "info",
        [["trend_ndvi_slope_per_year", null]],
      ),
    );
  }
  if (lstTrend && lstTrend.direction === "worsening") {
    insights.push(
      buildInsight(
        context,
        "risk",
        "Calentamiento superficial",
        `La tendencia de LST es ${directionLabel(lstTrend.direction)} y requiere estudio adicional.`,
        "warning",
        [["trend_lst_slope_per_year", null]],
      ),
    );
  }
  if (hotspot && (hotspot.priority_level === "high" || hotspot.priority_level === "medium")) {
    insights.push(
      buildInsight(
        context,
        "risk",
        "Prioridad de análisis",
        `El hotspot tiene prioridad ${hotspot.priority_level}; no es una priorización de inversión.`,
        hotspot.priority_level === "high" ? "critical" : "warning",
        [["hotspot_score", context.request.year]],
      ),
    );
  }

  insights.push(
    buildInsight(
      context,
      "caveat",
      "Datos territoriales fijos",
      territorialCaveat(context),
      "warning",
      [["territorial_reference_year", context.district?.territorial_reference_year ?? null]],
    ),
  );

  return {
    answer,
    insights,
    citations: buildCitations(context, insights),
  };
}

function chatDraft(context: AIContext): AIDraft {
  const question = (context.request.question ?? "").toLowerCase();
  const districtName = context.district?.name;

  if (!districtName) {
    const index = numeric(context, "municipal_average_socioenvironmental_index");
    const period = text(context, "period");
    const answer = `El dataset contiene ${fmt(numeric(context, "district_count"), 0)} distritos y cubre el periodo ${period ?? "declarado"}. El ICVSA promedio municipal es ${fmt(index, 1)}. ${statusCaveat(context)} La lectura es descriptiva y no implica causalidad.`;
    const insights: AIDraftInsight[] = [
      buildInsight(context, "observation", "Cobertura del dataset", `Periodo ${period ?? "no disponible"}.`, "info", [
        ["period", null],
        ["district_count", null],
      ]),
      buildInsight(context, "observation", "Promedio municipal", `ICVSA municipal ${fmt(index, 1)}.`, "info", [
        ["municipal_average_socioenvironmental_index", null],
      ]),
    ];
    return { answer, insights, citations: buildCitations(context, insights) };
  }

  let answer: string;
  const insights: AIDraftInsight[] = [];

  if (/poblaci|habitante|demograf/.test(question)) {
    answer = `${districtName}: ${populationSentence(context)} ${statusCaveat(context)} La lectura es descriptiva y no implica causalidad.`;
    insights.push(
      buildInsight(context, "observation", "Demografía", populationSentence(context), "info", [
        ["population", null],
        ["area_km2", null],
      ]),
    );
  } else if (/ndvi|veget|deforest|verde|arbol|árbol/.test(question)) {
    answer = `${districtName}: ${vegetationSentence(context)} ${statusCaveat(context)} La lectura es descriptiva y no implica causalidad.`;
    insights.push(
      buildInsight(context, "observation", "Vegetación", vegetationSentence(context), "info", [
        ["ndvi_mean", context.request.year],
        ["trend_ndvi_slope_per_year", null],
      ]),
    );
  } else if (/temperatura|calor|lst|superficial|isla de calor/.test(question)) {
    answer = `${districtName}: ${temperatureSentence(context)} ${statusCaveat(context)} La lectura es descriptiva y no implica causalidad.`;
    insights.push(
      buildInsight(context, "observation", "Temperatura superficial", temperatureSentence(context), "info", [
        ["lst_mean_celsius", context.request.year],
        ["trend_lst_slope_per_year", null],
      ]),
    );
  } else if (/equip|escuela|salud|área verde|area verde|jardín|jardin/.test(question)) {
    answer = `${districtName}: ${equipmentSentence(context)} ${territorialCaveat(context)} ${statusCaveat(context)}`;
    insights.push(
      buildInsight(context, "observation", "Equipamiento", equipmentSentence(context), "info", [
        ["equipment_access_index", null],
        ["green_area_m2_per_capita", null],
      ]),
    );
  } else if (/transporte|movilidad|parada|bus/.test(question)) {
    answer = `${districtName}: ${mobilitySentence(context)} ${territorialCaveat(context)} ${statusCaveat(context)}`;
    insights.push(
      buildInsight(context, "observation", "Movilidad", mobilitySentence(context), "info", [
        ["mobility_access_index", null],
        ["transport_coverage_fraction", null],
      ]),
    );
  } else if (/hotspot|prioridad|riesgo|alerta/.test(question)) {
    answer = `${districtName}: ${hotspotSentence(context)} ${statusCaveat(context)} No es una evaluación oficial ni una priorización de inversión.`;
    insights.push(
      buildInsight(context, "risk", "Hotspot", hotspotSentence(context), "warning", [
        ["hotspot_score", context.request.year],
      ]),
    );
  } else {
    const index = numeric(context, "socioenvironmental_index");
    answer = `${districtName} presenta una condición ${conditionLabel(index)} con un ICVSA de ${fmt(index, 1)} en ${context.request.year}. ${vegetationSentence(context)} ${temperatureSentence(context)} ${territorialCaveat(context)} ${statusCaveat(context)} La lectura es descriptiva y no implica causalidad.`;
    insights.push(
      buildInsight(context, "observation", "Resumen del distrito", `ICVSA ${fmt(index, 1)} en ${context.request.year}.`, "info", [
        ["socioenvironmental_index", context.request.year],
        ["ndvi_mean", context.request.year],
        ["lst_mean_celsius", context.request.year],
      ]),
    );
    insights.push(
      buildInsight(context, "caveat", "Datos territoriales fijos", territorialCaveat(context), "warning", [
        ["territorial_reference_year", context.district?.territorial_reference_year ?? null],
      ]),
    );
  }

  if (insights.length === 0) {
    insights.push(
      buildInsight(context, "observation", "Resumen del distrito", `ICVSA ${fmt(numeric(context, "socioenvironmental_index"), 1)}.`, "info", [
        ["socioenvironmental_index", context.request.year],
      ]),
    );
  }

  return { answer, insights, citations: buildCitations(context, insights) };
}

export function buildFallback(context: AIContext): AIDraft {
  return context.request.mode === "diagnosis" ? diagnosisDraft(context) : chatDraft(context);
}
