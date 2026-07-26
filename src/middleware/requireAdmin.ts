import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new ApiError(401, "Admin authentication required", "UNAUTHENTICATED"));
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { role?: string };
    if (payload.role !== "admin") {
      next(new ApiError(401, "Invalid or expired admin session", "UNAUTHENTICATED"));
      return;
    }
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired admin session", "UNAUTHENTICATED"));
  }
}
