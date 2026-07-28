import { Router } from "express";
import { getBankAccounts } from "../controllers/bankAccount.controller.js";
import {
  getMyBankDepositDetail,
  getMyBankDepositsList,
  submitBankDepositHandler,
} from "../controllers/bankDeposit.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { bankDepositLimiter } from "../middleware/rateLimiters.js";
import { listBankDepositsQuerySchema, submitBankDepositSchema } from "../validators/bankDeposit.schema.js";

export const bankDepositRouter = Router();

bankDepositRouter.get("/bank-accounts", requireAuth, getBankAccounts);
bankDepositRouter.post(
  "/bank-deposits",
  requireAuth,
  bankDepositLimiter,
  validateBody(submitBankDepositSchema),
  submitBankDepositHandler,
);
bankDepositRouter.get(
  "/bank-deposits",
  requireAuth,
  validateQuery(listBankDepositsQuerySchema),
  getMyBankDepositsList,
);
bankDepositRouter.get("/bank-deposits/:id", requireAuth, getMyBankDepositDetail);
