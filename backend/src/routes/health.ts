import { Router } from "express";

import { store } from "../data/store.js";
import { asyncHandler } from "../http/errors.js";
import { METHODOLOGY_VERSION } from "../types/geoqocha.js";

export const healthRouter = Router();

const STARTED_AT = Date.now();

healthRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    let data: { last_processed_year: number | null; methodology_version: string; data_mode: string } | null = null;
    let dataAvailable = false;
    try {
      data = {
        last_processed_year: store.getLastDataYear(),
        methodology_version: METHODOLOGY_VERSION,
        data_mode: store.getDataMode(),
      };
      dataAvailable = true;
    } catch {
      data = null;
    }

    response.json({
      status: dataAvailable ? "ok" : "degraded",
      uptime_seconds: Math.floor((Date.now() - STARTED_AT) / 1000),
      data,
      dependencies: {
        gamc_wms: process.env.GAMC_WMS_URL ? "configured" : "not_configured",
        ai_provider: process.env.AI_API_KEY ? "configured" : "not_configured",
      },
    });
  }),
);
