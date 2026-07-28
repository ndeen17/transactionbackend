import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toBankWithdrawalSummary } from "../utils/bankWithdrawalSummary.js";
import {
  getMyBankWithdrawal,
  listMyBankWithdrawals,
  submitBankWithdrawal,
} from "../services/bankWithdrawal.service.js";
import type { SubmitBankWithdrawalInput } from "../validators/bankWithdrawal.schema.js";
import type { ListWithdrawalsQuery } from "../validators/withdrawal.schema.js";
import { toTransactionSummary } from "../utils/transactionSummary.js";

export const submitBankWithdrawalHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { amount, bankName, accountName, accountNumber, routingNumber, pin } =
    req.body as SubmitBankWithdrawalInput;

  const { request, transaction } = await submitBankWithdrawal({
    userId: new Types.ObjectId(req.userId),
    amountMinor: amount,
    bankName,
    accountName,
    accountNumber,
    routingNumber: routingNumber || undefined,
    pin,
  });

  res.status(201).json({
    success: true,
    data: { request: toBankWithdrawalSummary(request), transaction: toTransactionSummary(transaction) },
  });
});

export const getMyBankWithdrawalsList = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as ListWithdrawalsQuery;

  const result = await listMyBankWithdrawals({
    userId: new Types.ObjectId(req.userId),
    page,
    limit,
  });

  res.json({
    success: true,
    data: {
      items: result.items.map(toBankWithdrawalSummary),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const getMyBankWithdrawalDetail = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await getMyBankWithdrawal(new Types.ObjectId(req.userId), req.params.id!);
  res.json({ success: true, data: toBankWithdrawalSummary(request) });
});
