import cors from "cors";
import express, { type Express } from "express";

import { errorHandler } from "./http/errors.js";
import { aiAnalystRouter } from "./routes/ai-analyst.js";
import { analysisRouter } from "./routes/analysis.js";
import { comparisonRouter } from "./routes/comparison.js";
import { districtsRouter } from "./routes/districts.js";
import { gamcRouter } from "./routes/gamc.js";
import { healthRouter } from "./routes/health.js";
import { heatmapRouter } from "./routes/heatmap.js";
import { hotspotsRouter } from "./routes/hotspots.js";
import { methodologyRouter } from "./routes/methodology.js";
import { sourcesRouter } from "./routes/sources.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
    }),
  );
  app.use(express.json({ limit: "32kb" }));

  app.use("/api/districts", districtsRouter);
  app.use("/api/comparison", comparisonRouter);
  app.use("/api/hotspots", hotspotsRouter);
  app.use("/api/heatmap", heatmapRouter);
  app.use("/api/analysis", analysisRouter);
  app.use("/api/methodology", methodologyRouter);
  app.use("/api/sources", sourcesRouter);
  app.use("/api/gamc", gamcRouter);
  app.use("/api/health", healthRouter);
  app.use("/api/ai-analyst", aiAnalystRouter);

  app.use("/api", (_request, response) => {
    response.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "El recurso solicitado no existe.",
        details: null,
      },
    });
  });

  app.use(errorHandler);

  return app;
}
