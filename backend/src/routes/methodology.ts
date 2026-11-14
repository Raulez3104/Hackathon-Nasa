import { Router } from "express";

import { store } from "../data/store.js";
import { asyncHandler } from "../http/errors.js";

export const methodologyRouter = Router();

methodologyRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json(store.getMethodology());
  }),
);
