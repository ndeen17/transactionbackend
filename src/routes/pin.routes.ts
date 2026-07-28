import { Router } from "express";
import { getPinStatusHandler, resetPinHandler, setupPinHandler } from "../controllers/pin.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";
import { pinSetupLimiter } from "../middleware/rateLimiters.js";
import { setupPinSchema } from "../validators/pin.schema.js";

export const pinRouter = Router();

pinRouter.get("/status", requireAuth, getPinStatusHandler);
pinRouter.post(
  "/setup",
  requireAuth,
  pinSetupLimiter,
  validateBody(setupPinSchema),
  setupPinHandler,
);
pinRouter.post(
  "/reset",
  requireAuth,
  pinSetupLimiter,
  validateBody(setupPinSchema),
  resetPinHandler,
);
