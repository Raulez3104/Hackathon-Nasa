import { Router } from "express";

import { store } from "../data/store.js";
import { asyncHandler } from "../http/errors.js";

export const sourcesRouter = Router();

sourcesRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({ sources: store.getSources() });
  }),
);
