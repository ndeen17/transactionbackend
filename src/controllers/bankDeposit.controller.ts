import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toBankDepositSummary } from "../utils/bankDepositSummary.js";
import {
  getMyBankDeposit,
  listMyBankDeposits,
  submitBankDeposit,
} from "../services/bankDeposit.service.js";
import type { ListBankDepositsQuery, SubmitBankDepositInput } from "../validators/bankDeposit.schema.js";

export const submitBankDepositHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { bankAccountId, amount, senderReference, pin } = req.body as SubmitBankDepositInput;

  const request = await submitBankDeposit({
    userId: new Types.ObjectId(req.userId),
    bankAccountId,
    amountMinor: amount,
    senderReference: senderReference || undefined,
    pin,
  });

  res.status(201).json({ success: true, data: toBankDepositSummary(request) });
});

export const getMyBankDepositsList = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as ListBankDepositsQuery;

  const result = await listMyBankDeposits({
    userId: new Types.ObjectId(req.userId),
    page,
    limit,
  });

  res.json({
    success: true,
    data: {
      items: result.items.map(toBankDepositSummary),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const getMyBankDepositDetail = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await getMyBankDeposit(new Types.ObjectId(req.userId), req.params.id!);
  res.json({ success: true, data: toBankDepositSummary(request) });
});
