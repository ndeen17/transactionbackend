import { Router } from "express";
import {
  adminLogin,
  approveUserKyc,
  getUser,
  getUsers,
  submitBalanceAdjustment,
  suspendUserHandler,
  unsuspendUserHandler,
} from "../controllers/admin.controller.js";
import {
  adminCreateCryptoAsset,
  adminDeleteCryptoAsset,
  adminGetCryptoAssets,
  adminGetCryptoCatalog,
  adminUpdateCryptoAsset,
} from "../controllers/adminCryptoAsset.controller.js";
import {
  adminAcceptCryptoDeposit,
  adminGetCryptoDepositDetail,
  adminGetCryptoDeposits,
  adminRejectCryptoDeposit,
} from "../controllers/adminCryptoDeposit.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { adminLoginLimiter } from "../middleware/rateLimiters.js";
import { adminLoginSchema, balanceAdjustmentSchema, listAdminUsersQuerySchema } from "../validators/admin.schema.js";
import { createCryptoAssetSchema, updateCryptoAssetSchema } from "../validators/cryptoAsset.schema.js";
import {
  listCryptoDepositsQuerySchema,
  rejectCryptoDepositSchema,
} from "../validators/cryptoDeposit.schema.js";

export const adminRouter = Router();

adminRouter.post("/login", adminLoginLimiter, validateBody(adminLoginSchema), adminLogin);
adminRouter.get("/users", requireAdmin, validateQuery(listAdminUsersQuerySchema), getUsers);
adminRouter.get("/users/:id", requireAdmin, getUser);
adminRouter.post("/users/:id/kyc/approve", requireAdmin, approveUserKyc);
adminRouter.post("/users/:id/suspend", requireAdmin, suspendUserHandler);
adminRouter.post("/users/:id/unsuspend", requireAdmin, unsuspendUserHandler);
adminRouter.post(
  "/users/:id/balance-adjustment",
  requireAdmin,
  validateBody(balanceAdjustmentSchema),
  submitBalanceAdjustment,
);

adminRouter.get("/crypto-catalog", requireAdmin, adminGetCryptoCatalog);
adminRouter.get("/crypto-assets", requireAdmin, adminGetCryptoAssets);
adminRouter.post("/crypto-assets", requireAdmin, validateBody(createCryptoAssetSchema), adminCreateCryptoAsset);
adminRouter.patch(
  "/crypto-assets/:id",
  requireAdmin,
  validateBody(updateCryptoAssetSchema),
  adminUpdateCryptoAsset,
);
adminRouter.delete("/crypto-assets/:id", requireAdmin, adminDeleteCryptoAsset);

adminRouter.get(
  "/crypto-deposits",
  requireAdmin,
  validateQuery(listCryptoDepositsQuerySchema),
  adminGetCryptoDeposits,
);
adminRouter.get("/crypto-deposits/:id", requireAdmin, adminGetCryptoDepositDetail);
adminRouter.post("/crypto-deposits/:id/accept", requireAdmin, adminAcceptCryptoDeposit);
adminRouter.post(
  "/crypto-deposits/:id/reject",
  requireAdmin,
  validateBody(rejectCryptoDepositSchema),
  adminRejectCryptoDeposit,
);
