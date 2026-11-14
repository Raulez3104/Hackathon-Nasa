import { Router } from "express";

import { HOTSPOT_DISCLAIMER } from "../data/constants.js";
import { buildHotspots } from "../data/derive.js";
import { store } from "../data/store.js";
import { asyncHandler } from "../http/errors.js";
import { parseEnum, parseInteger } from "../http/validation.js";
import { METHODOLOGY_VERSION, type PriorityLevel } from "../types/geoqocha.js";

export const hotspotsRouter = Router();

hotspotsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const lastDataYear = store.getLastDataYear() ?? new Date().getFullYear();
    const year = parseInteger(request.query.year, "year", {
      defaultValue: lastDataYear,
      min: 2015,
      max: lastDataYear,
    }) as number;
    const minPriority = parseEnum(
      request.query.min_priority,
      "min_priority",
      ["low", "medium", "high", "insufficient_data"] as const,
      "medium",
    ) as PriorityLevel;

    response.json({
      year,
      methodology_version: METHODOLOGY_VERSION,
      disclaimer: HOTSPOT_DISCLAIMER,
      hotspots: buildHotspots(store, year, minPriority),
    });
  }),
);
