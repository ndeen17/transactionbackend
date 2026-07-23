import { Router } from "express";
import { getMe, login } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { loginLimiter } from "../middleware/rateLimiters.js";

export const authRouter = Router();

authRouter.post("/login", loginLimiter, login);
authRouter.get("/me", requireAuth, getMe);
