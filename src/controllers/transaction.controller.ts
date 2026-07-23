import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toTransactionSummary } from "../utils/transactionSummary.js";
import {
  depositMoney,
  getTransactionForUser,
  listTransactions,
  transferMoney,
} from "../services/transaction.service.js";
import type { DepositInput, TransferInput } from "../validators/transaction.schema.js";

export const submitTransfer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { recipientName, bankName, recipientAccountNumber, amount, narration, pin } =
    req.body as TransferInput;

  const transaction = await transferMoney({
    userId: new Types.ObjectId(req.userId),
    amountMinor: amount,
    narration: narration || undefined,
    pin,
    recipient: { name: recipientName, bankName, accountNumber: recipientAccountNumber },
  });

  res.status(201).json({ success: true, data: toTransactionSummary(transaction) });
});

export const submitDeposit = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { amount, pin } = req.body as DepositInput;

  const transaction = await depositMoney({
    userId: new Types.ObjectId(req.userId),
    amountMinor: amount,
    pin,
  });

  res.status(201).json({ success: true, data: toTransactionSummary(transaction) });
});

export const getTransactionsList = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };

  const result = await listTransactions({
    userId: new Types.ObjectId(req.userId),
    page,
    limit,
  });

  res.json({
    success: true,
    data: {
      items: result.items.map(toTransactionSummary),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const getTransactionDetail = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const transaction = await getTransactionForUser(new Types.ObjectId(req.userId), req.params.id!);
  res.json({ success: true, data: toTransactionSummary(transaction) });
});
