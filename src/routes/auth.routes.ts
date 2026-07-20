import { Router } from "express";
import { getMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, getMe);
