import { Router } from "express";
import {
  getMyCryptoWithdrawalDetail,
  getMyCryptoWithdrawalsList,
  submitCryptoWithdrawalHandler,
} from "../controllers/cryptoWithdrawal.controller.js";
import {
  getMyBankWithdrawalDetail,
  getMyBankWithdrawalsList,
  submitBankWithdrawalHandler,
} from "../controllers/bankWithdrawal.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { cryptoWithdrawalLimiter, bankWithdrawalLimiter } from "../middleware/rateLimiters.js";
import { submitCryptoWithdrawalSchema } from "../validators/cryptoWithdrawal.schema.js";
import { submitBankWithdrawalSchema } from "../validators/bankWithdrawal.schema.js";
import { listWithdrawalsQuerySchema } from "../validators/withdrawal.schema.js";

export const withdrawalRouter = Router();

withdrawalRouter.post(
  "/crypto-withdrawals",
  requireAuth,
  cryptoWithdrawalLimiter,
  validateBody(submitCryptoWithdrawalSchema),
  submitCryptoWithdrawalHandler,
);
withdrawalRouter.get(
  "/crypto-withdrawals",
  requireAuth,
  validateQuery(listWithdrawalsQuerySchema),
  getMyCryptoWithdrawalsList,
);
withdrawalRouter.get("/crypto-withdrawals/:id", requireAuth, getMyCryptoWithdrawalDetail);

withdrawalRouter.post(
  "/bank-withdrawals",
  requireAuth,
  bankWithdrawalLimiter,
  validateBody(submitBankWithdrawalSchema),
  submitBankWithdrawalHandler,
);
withdrawalRouter.get(
  "/bank-withdrawals",
  requireAuth,
  validateQuery(listWithdrawalsQuerySchema),
  getMyBankWithdrawalsList,
);
withdrawalRouter.get("/bank-withdrawals/:id", requireAuth, getMyBankWithdrawalDetail);
