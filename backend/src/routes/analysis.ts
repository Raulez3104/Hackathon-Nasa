import { Router } from "express";

import { buildCorrelation } from "../data/derive.js";
import { store } from "../data/store.js";
import { ApiError, asyncHandler } from "../http/errors.js";
import { parseEnum } from "../http/validation.js";

export const analysisRouter = Router();

analysisRouter.get(
  "/correlation",
  asyncHandler(async (request, response) => {
    const x = parseEnum(
      request.query.x,
      "x",
      ["ndvi_trend", "lst_trend", "environmental_index_trend"] as const,
      "ndvi_trend",
    );
    const y = parseEnum(
      request.query.y,
      "y",
      ["equipment_access_index", "mobility_access_index"] as const,
      "equipment_access_index",
    );
    const method = parseEnum(request.query.method, "method", ["pearson", "spearman"] as const, "spearman");

    const result = buildCorrelation(store, x, y, method);
    if (result.n < 8) {
      throw new ApiError(
        404,
        "NO_DATA",
        `No hay suficientes distritos con datos completos para calcular la correlación (n=${result.n}, mínimo 8).`,
        { n: result.n, min_n: 8, districts: result.districts },
      );
    }

    response.json(result);
  }),
);
