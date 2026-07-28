import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCryptoWithdrawalSummary } from "../utils/cryptoWithdrawalSummary.js";
import {
  getMyCryptoWithdrawal,
  listMyCryptoWithdrawals,
  submitCryptoWithdrawal,
} from "../services/cryptoWithdrawal.service.js";
import type { SubmitCryptoWithdrawalInput } from "../validators/cryptoWithdrawal.schema.js";
import type { ListWithdrawalsQuery } from "../validators/withdrawal.schema.js";
import { toTransactionSummary } from "../utils/transactionSummary.js";

export const submitCryptoWithdrawalHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { assetId, amountCrypto, walletAddress, network, pin } = req.body as SubmitCryptoWithdrawalInput;

  const { request, transaction } = await submitCryptoWithdrawal({
    userId: new Types.ObjectId(req.userId),
    assetId,
    amountCrypto,
    walletAddress,
    network: network || undefined,
    pin,
  });

  res.status(201).json({
    success: true,
    data: { request: toCryptoWithdrawalSummary(request), transaction: toTransactionSummary(transaction) },
  });
});

export const getMyCryptoWithdrawalsList = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as ListWithdrawalsQuery;

  const result = await listMyCryptoWithdrawals({
    userId: new Types.ObjectId(req.userId),
    page,
    limit,
  });

  res.json({
    success: true,
    data: {
      items: result.items.map(toCryptoWithdrawalSummary),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const getMyCryptoWithdrawalDetail = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await getMyCryptoWithdrawal(new Types.ObjectId(req.userId), req.params.id!);
  res.json({ success: true, data: toCryptoWithdrawalSummary(request) });
});
