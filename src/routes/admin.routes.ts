import { Router } from "express";
import {
  adminLogin,
  approveUserKyc,
  getUser,
  getUsers,
  submitBalanceAdjustment,
} from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { adminLoginLimiter } from "../middleware/rateLimiters.js";
import { adminLoginSchema, balanceAdjustmentSchema, listAdminUsersQuerySchema } from "../validators/admin.schema.js";

export const adminRouter = Router();

adminRouter.post("/login", adminLoginLimiter, validateBody(adminLoginSchema), adminLogin);
adminRouter.get("/users", requireAdmin, validateQuery(listAdminUsersQuerySchema), getUsers);
adminRouter.get("/users/:id", requireAdmin, getUser);
adminRouter.post("/users/:id/kyc/approve", requireAdmin, approveUserKyc);
adminRouter.post(
  "/users/:id/balance-adjustment",
  requireAdmin,
  validateBody(balanceAdjustmentSchema),
  submitBalanceAdjustment,
);
