import { Router } from "express";

import { store } from "../data/store.js";
import { buildIndicators, getPoint, lastYearWithData, summaryText, INDICATOR_VARIABLES } from "../data/derive.js";
import { ApiError, asyncHandler } from "../http/errors.js";
import { parseBoolean, parseCsvStrings, parseEnum, parseInteger } from "../http/validation.js";

export const districtsRouter = Router();

districtsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const includeGeometry = parseBoolean(request.query.include_geometry, false);
    const districts = store.getDataset().districts.map((district) => {
      const summary: Record<string, unknown> = {
        district_id: district.district_id,
        name: district.name,
        area_km2: district.area_km2,
        population: district.population,
        population_year: district.population_year,
        last_data_year: lastYearWithData(district),
        territorial_reference_year: district.territorial_reference_year,
        latest_socioenvironmental_index: district.latest_socioenvironmental_index,
      };
      if (includeGeometry) summary.geometry = district.geometry;
      return summary;
    });

    response.json({ count: districts.length, districts });
  }),
);

districtsRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const districtId = parseInteger(request.params.id, "id", { required: true, min: 1 }) as number;
    const district = store.requireDistrict(districtId);
    const point = getPoint(district, district.latest_year);

    response.json({
      district_id: district.district_id,
      name: district.name,
      area_km2: district.area_km2,
      population: district.population,
      population_year: district.population_year,
      latest: {
        year: point?.year ?? district.latest_year,
        ndvi_mean: point?.ndvi_mean ?? null,
        lst_mean_celsius: point?.lst_mean_celsius ?? null,
        environmental_index: point?.environmental_index ?? null,
        socioenvironmental_index: point?.socioenvironmental_index ?? null,
        index_without_territorial: point?.index_without_territorial ?? null,
        territorial_reference_year: district.territorial_reference_year,
        data_quality_flag: point?.data_quality_flag ?? "insufficient",
      },
      trends: district.trends,
      sources: district.source_refs,
      summary_text: summaryText(district),
    });
  }),
);

districtsRouter.get(
  "/:id/indicators",
  asyncHandler(async (request, response) => {
    const districtId = parseInteger(request.params.id, "id", { required: true, min: 1 }) as number;
    const district = store.requireDistrict(districtId);
    const lastDataYear = store.getLastDataYear() ?? new Date().getFullYear();
    const from = parseInteger(request.query.from, "from", { defaultValue: 2015, min: 2015, max: lastDataYear }) as number;
    const to = parseInteger(request.query.to, "to", {
      defaultValue: lastDataYear,
      min: 2015,
      max: new Date().getFullYear(),
    }) as number;

    if (from > to) {
      throw new ApiError(400, "INVALID_PARAMETER", "El rango solicitado es inválido: from no puede superar a to.", {
        from,
        to,
      });
    }

    parseEnum(request.query.aggregation, "aggregation", ["annual", "monthly"] as const, "annual");

    const requested = parseCsvStrings(request.query.variables, "variables", INDICATOR_VARIABLES);
    const variables = (requested ?? [...INDICATOR_VARIABLES]) as Array<(typeof INDICATOR_VARIABLES)[number]>;

    response.json(buildIndicators(store, district, from, to, variables));
  }),
);
