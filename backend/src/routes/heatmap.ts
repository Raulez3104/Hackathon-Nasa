import { existsSync } from "node:fs";
import { Router } from "express";

import { buildHeatmap } from "../data/derive.js";
import { store } from "../data/store.js";
import { ApiError, asyncHandler } from "../http/errors.js";
import { parseEnum, parseInteger } from "../http/validation.js";

export const heatmapRouter = Router();

heatmapRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const lastDataYear = store.getLastDataYear() ?? new Date().getFullYear();
    const variable = parseEnum(request.query.variable, "variable", ["lst", "severity", "icvsa"] as const, "lst");
    const year = parseInteger(request.query.year, "year", {
      defaultValue: lastDataYear,
      min: 2015,
      max: lastDataYear,
    }) as number;
    const format = parseEnum(request.query.format, "format", ["cells", "raster"] as const, "cells");

    if (format === "raster") {
      const raster = store.getHeatmapRaster(year);
      const rasterPath = store.getRasterPath(year, variable);
      if (!raster || !rasterPath || !existsSync(rasterPath)) {
        throw new ApiError(404, "NO_DATA", `No hay raster precalculado para ${variable} en ${year}.`, {
          variable,
          year,
        });
      }
      response.json({
        variable,
        year,
        raster_url: raster.raster_url,
        bbox: raster.bbox,
        attribution: raster.attribution,
      });
      return;
    }

    response.json(buildHeatmap(store, variable, year));
  }),
);

heatmapRouter.get(
  "/:year/:file",
  asyncHandler(async (request, response) => {
    const year = parseInteger(request.params.year, "year", { required: true, min: 2015, max: 2100 }) as number;
    const file = Array.isArray(request.params.file) ? request.params.file[0] : request.params.file;
    const match = /^([a-z]+)\.png$/.exec(file);
    if (!match) {
      throw new ApiError(400, "INVALID_PARAMETER", "El archivo solicitado no es un PNG de mapa de calor válido.");
    }
    const variable = match[1];
    const rasterPath = store.getRasterPath(year, variable);
    if (!rasterPath || !existsSync(rasterPath)) {
      throw new ApiError(404, "NO_DATA", `No existe el raster ${variable} para ${year}.`, { variable, year });
    }
    response.setHeader("Cache-Control", "public, max-age=21600");
    response.type("png").sendFile(rasterPath);
  }),
);
