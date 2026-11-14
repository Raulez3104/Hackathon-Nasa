import { buildHotspot, getPoint, getTrend, municipalAverage } from "../data/derive.js";
import { store } from "../data/store.js";
import { round } from "../data/stats.js";
import { ApiError } from "../http/errors.js";
import { buildContextText } from "./context.js";
import type { AIContext, AIContextTrend, AIFact } from "./types.js";

const METHODOLOGY_SOURCE = "geoqocha_methodology";
const EQUIPMENT_SOURCE = "gamc_equipment";
const MOBILITY_SOURCE = "gamc_transport";
const EVIDENCE_FIELDS = [
  "ndvi_mean",
  "lst_mean_celsius",
  "environmental_index",
  "socioenvironmental_index",
  "index_without_territorial",
] as const;

function sourceLabel(sourceRef: string): string {
  return store.getSource(sourceRef).name;
}

function pickSource(sourceRefs: string[], preferred: string): string {
  if (sourceRefs.includes(preferred)) return preferred;
  if (sourceRefs.includes("mock")) return "mock";
  return sourceRefs[0] ?? preferred;
}

function addFact(
  facts: AIFact[],
  input: Omit<AIFact, "source_label"> & { source_label?: string },
): void {
  facts.push({
    ...input,
    source_label: input.source_label ?? sourceLabel(input.source_ref),
  });
}

function inferDistrictId(requestDistrictId: number | null, question: string | null): number | null {
  if (requestDistrictId !== null) return requestDistrictId;
  if (!question) return null;
  const match = /distrito\s*(?:municipal\s*)?(\d{1,2})/i.exec(question);
  if (!match) return null;
  const candidate = Number(match[1]);
  return store.getDistrict(candidate) ? candidate : null;
}

export function buildAIContext(input: {
  mode: "chat" | "diagnosis";
  district_id: number | null;
  year: number | null;
  question: string | null;
}): AIContext {
  const dataset = store.getDataset();
  const districtId = inferDistrictId(input.district_id, input.question);
  const district = districtId !== null ? store.requireDistrict(districtId) : null;
  const lastDataYear = store.getLastDataYear() ?? dataset.districts[0]?.latest_year ?? null;
  const year = input.year ?? district?.latest_year ?? lastDataYear;

  if (year === null) {
    throw new ApiError(404, "CONTEXT_NOT_FOUND", "No hay aÃ±os con datos para construir el contexto.");
  }

  const facts: AIFact[] = [];
  const trends: AIContextTrend[] = [];
  const currentYear = year;

  if (district) {
    const ndviSource = pickSource(district.source_refs, "nasa_mod13q1");
    const lstSource = pickSource(district.source_refs, "nasa_mod11a2");
    const derivedSource = pickSource(district.source_refs, "geoqocha_methodology");
    const equipmentSource = pickSource(district.source_refs, "gamc_equipment");
    const mobilitySource = pickSource(district.source_refs, "gamc_transport");

    addFact(facts, {
      key: "district_name",
      district_id: district.district_id,
      year: null,
      field: "name",
      label: "Nombre del distrito",
      value: district.name,
      unit: null,
      source_ref: district.source_refs[0] ?? "gamc_districts",
    });
    addFact(facts, {
      key: "population",
      district_id: district.district_id,
      year: district.population_year,
      field: "population",
      label: "Población",
      value: district.population,
      unit: "habitantes",
      source_ref: "gamc_population",
    });
    addFact(facts, {
      key: "population_year",
      district_id: district.district_id,
      year: district.population_year,
      field: "population_year",
      label: "Año de referencia de la población",
      value: district.population_year,
      unit: "año",
      source_ref: "gamc_population",
    });
    addFact(facts, {
      key: "area_km2",
      district_id: district.district_id,
      year: null,
      field: "area_km2",
      label: "Superficie",
      value: district.area_km2,
      unit: "kmÂ²",
      source_ref: "gamc_districts",
    });
    addFact(facts, {
      key: "territorial_reference_year",
      district_id: district.district_id,
      year: district.territorial_reference_year,
      field: "territorial_reference_year",
      label: "AÃ±o de referencia territorial",
      value: district.territorial_reference_year,
      unit: "aÃ±o",
      source_ref: EQUIPMENT_SOURCE,
    });

    const point = getPoint(district, currentYear);
    if (point) {
      addFact(facts, {
        key: "ndvi_mean",
        district_id: district.district_id,
        year: currentYear,
        field: "ndvi_mean",
        label: "NDVI medio anual",
        value: point.ndvi_mean,
        unit: "Ã­ndice",
        source_ref: ndviSource,
        data_quality_flag: point.data_quality_flag,
      });
      addFact(facts, {
        key: "lst_mean_celsius",
        district_id: district.district_id,
        year: currentYear,
        field: "lst_mean_celsius",
        label: "Temperatura superficial media",
        value: point.lst_mean_celsius,
        unit: "Â°C",
        source_ref: lstSource,
        data_quality_flag: point.data_quality_flag,
      });
      addFact(facts, {
        key: "environmental_index",
        district_id: district.district_id,
        year: currentYear,
        field: "environmental_index",
        label: "Ãndice ambiental",
        value: point.environmental_index,
        unit: "Ã­ndice 1-100",
        source_ref: derivedSource,
        data_quality_flag: point.data_quality_flag,
      });
      addFact(facts, {
        key: "socioenvironmental_index",
        district_id: district.district_id,
        year: currentYear,
        field: "socioenvironmental_index",
        label: "ICVSA",
        value: point.socioenvironmental_index,
        unit: "Ã­ndice 1-100",
        source_ref: derivedSource,
        data_quality_flag: point.data_quality_flag,
      });
      addFact(facts, {
        key: "index_without_territorial",
        district_id: district.district_id,
        year: currentYear,
        field: "index_without_territorial",
        label: "ICVSA sin componente territorial",
        value: point.index_without_territorial,
        unit: "Ã­ndice 1-100",
        source_ref: derivedSource,
        data_quality_flag: point.data_quality_flag,
      });
      addFact(facts, {
        key: "data_quality_flag",
        district_id: district.district_id,
        year: currentYear,
        field: "data_quality_flag",
        label: "Calidad del dato",
        value: point.data_quality_flag,
        unit: null,
        source_ref: derivedSource,
      });
    }

    for (const seriesPoint of district.series) {
      for (const field of ["ndvi_mean", "lst_mean_celsius", "environmental_index"] as const) {
        const value = seriesPoint[field];
        if (value === null) continue;
        addFact(facts, {
          key: `${field}_${seriesPoint.year}`,
          district_id: district.district_id,
          year: seriesPoint.year,
          field,
          label: `Serie ${field}`,
          value,
          unit: field === "lst_mean_celsius" ? "Â°C" : field === "ndvi_mean" ? "Ã­ndice" : "Ã­ndice 1-100",
          source_ref:
            field === "ndvi_mean"
              ? ndviSource
              : field === "lst_mean_celsius"
                ? lstSource
                : derivedSource,
          data_quality_flag: seriesPoint.data_quality_flag,
        });
      }
    }

    for (const trend of district.trends) {
      trends.push({
        variable: trend.variable,
        direction: trend.direction,
        slope_per_year: trend.slope_per_year,
        unit: trend.unit,
        years_used: trend.years_used,
        is_significant: trend.is_significant,
        accelerated: trend.accelerated,
      });
      addFact(facts, {
        key: `trend_${trend.variable}`,
        district_id: district.district_id,
        year: null,
        field: `trend_${trend.variable}_slope_per_year`,
        label: `Pendiente de tendencia ${trend.variable}`,
        value: trend.slope_per_year,
        unit: trend.unit,
        source_ref: METHODOLOGY_SOURCE,
      });
      addFact(facts, {
        key: `trend_direction_${trend.variable}`,
        district_id: district.district_id,
        year: null,
        field: `trend_${trend.variable}_direction`,
        label: `DirecciÃ³n de tendencia ${trend.variable}`,
        value: trend.direction,
        unit: null,
        source_ref: METHODOLOGY_SOURCE,
      });
    }

    const equipment = district.equipment;
    const equipmentFacts: Array<[string, string, number | null, string | null, string]> = [
      ["green_area_m2_per_capita", "Ãrea verde por habitante", equipment.green_area_m2_per_capita, "mÂ²/habitante", equipmentSource],
      ["schools_per_1000", "Escuelas por 1000 habitantes", equipment.schools_per_1000, "por 1000", equipmentSource],
      ["health_centers_per_1000", "Centros de salud por 1000 habitantes", equipment.health_centers_per_1000, "por 1000", equipmentSource],
      ["transport_coverage_fraction", "Cobertura de transporte", equipment.transport_coverage_fraction, "fracciÃ³n 0-1", mobilitySource],
      ["equipment_access_index", "Ãndice de acceso a equipamiento", equipment.equipment_access_index, "Ã­ndice 1-100", equipmentSource],
      ["mobility_access_index", "Ãndice de acceso a movilidad", equipment.mobility_access_index, "Ã­ndice 1-100", mobilitySource],
    ];
    for (const [field, label, value, unit, sourceRef] of equipmentFacts) {
      addFact(facts, {
        key: field,
        district_id: district.district_id,
        year: district.territorial_reference_year,
        field,
        label,
        value,
        unit,
        source_ref: sourceRef,
      });
    }
    if (equipment.deficit_flags.length > 0) {
      addFact(facts, {
        key: "deficit_flags",
        district_id: district.district_id,
        year: district.territorial_reference_year,
        field: "deficit_flags",
        label: "Señales de déficit territorial",
        value: equipment.deficit_flags.join(", "),
        unit: null,
        source_ref: equipmentSource,
      });
    }

    const hotspot = buildHotspot(district, currentYear);
    addFact(facts, {
      key: "hotspot_score",
      district_id: district.district_id,
      year: currentYear,
      field: "hotspot_score",
      label: "Puntaje de hotspot",
      value: hotspot.score,
      unit: "puntaje",
      source_ref: METHODOLOGY_SOURCE,
    });
    addFact(facts, {
      key: "hotspot_priority",
      district_id: district.district_id,
      year: currentYear,
      field: "hotspot_priority",
      label: "Prioridad de hotspot",
      value: hotspot.priority_level,
      unit: null,
      source_ref: METHODOLOGY_SOURCE,
    });

    const averageValues: Record<string, number | null> = {
      ndvi_mean: municipalAverage(store, currentYear, "ndvi_mean"),
      lst_mean_celsius: municipalAverage(store, currentYear, "lst_mean_celsius"),
      environmental_index: municipalAverage(store, currentYear, "environmental_index"),
      socioenvironmental_index: municipalAverage(store, currentYear, "socioenvironmental_index"),
    };
    for (const [field, value] of Object.entries(averageValues)) {
      addFact(facts, {
        key: `municipal_average_${field}`,
        district_id: null,
        year: currentYear,
        field: `municipal_average_${field}`,
        label: `Promedio municipal de ${field}`,
        value: round(value, 2),
        unit: field === "lst_mean_celsius" ? "Â°C" : field === "ndvi_mean" ? "Ã­ndice" : "Ã­ndice 1-100",
        source_ref: METHODOLOGY_SOURCE,
      });
    }
  } else {
    addFact(facts, {
      key: "district_count",
      district_id: null,
      year: null,
      field: "district_count",
      label: "Cantidad de distritos en el dataset",
      value: dataset.districts.length,
      unit: "distritos",
      source_ref: METHODOLOGY_SOURCE,
    });
    addFact(facts, {
      key: "period",
      district_id: null,
      year: null,
      field: "period",
      label: "Periodo del dataset",
      value: `${store.getYears()[0] ?? ""}-${lastDataYear ?? ""}`,
      unit: null,
      source_ref: METHODOLOGY_SOURCE,
    });
    for (const item of dataset.districts) {
      const point = getPoint(item, currentYear);
      addFact(facts, {
        key: `district_${item.district_id}_index_${currentYear}`,
        district_id: item.district_id,
        year: currentYear,
        field: "socioenvironmental_index",
        label: `ICVSA de ${item.name} en ${currentYear}`,
        value: point?.socioenvironmental_index ?? null,
        unit: "índice 1-100",
        source_ref: METHODOLOGY_SOURCE,
      });
    }
    for (const field of ["ndvi_mean", "lst_mean_celsius", "environmental_index", "socioenvironmental_index"] as const) {
      addFact(facts, {
        key: `municipal_average_${field}`,
        district_id: null,
        year: currentYear,
        field: `municipal_average_${field}`,
        label: `Promedio municipal de ${field}`,
        value: round(municipalAverage(store, currentYear, field), 2),
        unit: field === "lst_mean_celsius" ? "°C" : field === "ndvi_mean" ? "índice" : "índice 1-100",
        source_ref: METHODOLOGY_SOURCE,
      });
    }
  }

  const allowedNumbers = buildAllowedNumbers(facts, trends);
  const sources = [...new Set(facts.map((fact) => fact.source_ref))].map((id) => ({
    id,
    label: sourceLabel(id),
  }));

  const context: AIContext = {
    request: {
      mode: input.mode,
      district_id: district?.district_id ?? null,
      year: currentYear,
      question: input.question,
    },
    district: district
      ? {
          district_id: district.district_id,
          name: district.name,
          population: district.population,
          population_year: district.population_year,
          area_km2: district.area_km2,
          territorial_reference_year: district.territorial_reference_year,
          latest_year: district.latest_year,
          risk_level: district.risk_level,
          data_status: district.data_status,
        }
      : null,
    facts,
    trends,
    hotspot: district ? buildHotspot(district, currentYear) : null,
    municipal_average: Object.fromEntries(
      facts
        .filter((fact) => fact.field.startsWith("municipal_average_"))
        .map((fact) => [fact.field.replace("municipal_average_", ""), typeof fact.value === "number" ? fact.value : null]),
    ),
    data_status: dataset.data_status,
    generated_at: dataset.generated_at,
    sources,
    context_text: "",
    allowed_numbers: [...allowedNumbers],
  };

  context.context_text = buildContextText(context);
  if (!context.facts.some((fact) => fact.value !== null)) {
    throw new ApiError(404, "CONTEXT_NOT_FOUND", "No hay datos suficientes para responder con citas.", {
      district_id: districtId,
      year,
    });
  }
  return context;
}

function buildAllowedNumbers(facts: AIFact[], trends: AIContextTrend[]): Set<string> {
  const values = new Set<string>();
  const add = (value: number): void => {
    values.add(String(value));
    values.add(String(round(value, 1)));
    values.add(String(round(value, 2)));
    values.add(String(round(value, 3)));
    if (value >= 0 && value <= 1) values.add(String(round(value * 100, 0)));
  };
  for (const fact of facts) {
    if (typeof fact.value === "number") add(fact.value);
    if (fact.year !== null) values.add(String(fact.year));
  }
  for (const trend of trends) {
    if (trend.slope_per_year !== null) add(trend.slope_per_year);
    for (const year of trend.years_used) values.add(String(year));
  }
  for (const number of [1, 8, 15, 20, 35, 100, 1000, 2015, 2025]) values.add(String(number));
  for (const weight of [0.35, 0.2, 0.1]) {
    values.add(String(weight));
    values.add(String(round(weight * 100, 0)));
  }
  values.add("0");
  return values;
}

export function factEvidence(context: AIContext, field: string, year: number | null): AIFact | undefined {
  return (
    context.facts.find((fact) => fact.field === field && (year === null || fact.year === year)) ??
    context.facts.find((fact) => fact.field === field)
  );
}

export function numericFacts(context: AIContext, fields: readonly string[]): AIFact[] {
  return context.facts.filter((fact) => fields.includes(fact.field) && typeof fact.value === "number");
}
