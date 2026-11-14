import { Router } from "express";

import { buildComparison } from "../data/derive.js";
import { store } from "../data/store.js";
import { asyncHandler } from "../http/errors.js";
import { parseCsvIntegers, parseCsvStrings, parseInteger } from "../http/validation.js";

export const COMPARISON_VARIABLES = [
  "ndvi",
  "lst",
  "environmental_index",
  "socioenvironmental_index",
  "equipment_access_index",
  "mobility_access_index",
] as const;

export const comparisonRouter = Router();

comparisonRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const lastDataYear = store.getLastDataYear() ?? new Date().getFullYear();
    const districts = parseCsvIntegers(request.query.districts, "districts", {
      required: true,
      minItems: 2,
      maxItems: 5,
      min: 1,
    });
    const year = parseInteger(request.query.year, "year", {
      required: true,
      min: 2015,
      max: lastDataYear,
    }) as number;
    const variables = parseCsvStrings(request.query.variables, "variables", COMPARISON_VARIABLES) ?? [
      ...COMPARISON_VARIABLES,
    ];

    response.json(buildComparison(store, districts, year, variables));
  }),
);
