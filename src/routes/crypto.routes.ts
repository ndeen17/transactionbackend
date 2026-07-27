import { Router } from "express";
import {
  getCryptoAssets,
  getMyCryptoDepositDetail,
  getMyCryptoDepositsList,
  submitCryptoDepositHandler,
} from "../controllers/crypto.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { cryptoDepositLimiter } from "../middleware/rateLimiters.js";
import { listCryptoDepositsQuerySchema, submitCryptoDepositSchema } from "../validators/cryptoDeposit.schema.js";

export const cryptoRouter = Router();

cryptoRouter.get("/assets", requireAuth, getCryptoAssets);
cryptoRouter.post(
  "/deposits",
  requireAuth,
  cryptoDepositLimiter,
  validateBody(submitCryptoDepositSchema),
  submitCryptoDepositHandler,
);
cryptoRouter.get(
  "/deposits",
  requireAuth,
  validateQuery(listCryptoDepositsQuerySchema),
  getMyCryptoDepositsList,
);
cryptoRouter.get("/deposits/:id", requireAuth, getMyCryptoDepositDetail);
