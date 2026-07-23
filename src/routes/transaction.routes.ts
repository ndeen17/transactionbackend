import { Router } from "express";
import {
  getTransactionDetail,
  getTransactionsList,
  submitDeposit,
  submitTransfer,
} from "../controllers/transaction.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { depositLimiter, transferLimiter } from "../middleware/rateLimiters.js";
import { depositSchema, listTransactionsQuerySchema, transferSchema } from "../validators/transaction.schema.js";

export const transactionRouter = Router();

transactionRouter.post(
  "/transfer",
  requireAuth,
  transferLimiter,
  validateBody(transferSchema),
  submitTransfer,
);
transactionRouter.post(
  "/deposit",
  requireAuth,
  depositLimiter,
  validateBody(depositSchema),
  submitDeposit,
);
transactionRouter.get(
  "/",
  requireAuth,
  validateQuery(listTransactionsQuerySchema),
  getTransactionsList,
);
transactionRouter.get("/:id", requireAuth, getTransactionDetail);
