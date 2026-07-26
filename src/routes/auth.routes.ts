import { Router } from "express";
import {
  confirmPasswordResetHandler,
  getMe,
  login,
  requestPasswordResetHandler,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";
import {
  loginLimiter,
  passwordResetConfirmLimiter,
  passwordResetRequestLimiter,
} from "../middleware/rateLimiters.js";
import { confirmPasswordResetSchema, requestPasswordResetSchema } from "../validators/passwordReset.schema.js";

export const authRouter = Router();

authRouter.post("/login", loginLimiter, login);
authRouter.get("/me", requireAuth, getMe);
authRouter.post(
  "/password-reset/request",
  passwordResetRequestLimiter,
  validateBody(requestPasswordResetSchema),
  requestPasswordResetHandler,
);
authRouter.post(
  "/password-reset/confirm",
  passwordResetConfirmLimiter,
  validateBody(confirmPasswordResetSchema),
  confirmPasswordResetHandler,
);
