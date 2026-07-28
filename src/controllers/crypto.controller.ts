import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCryptoAssetSummary } from "../utils/cryptoAssetSummary.js";
import { toCryptoDepositSummary } from "../utils/cryptoDepositSummary.js";
import { listCryptoAssets } from "../services/cryptoAsset.service.js";
import {
  getMyCryptoDeposit,
  listMyCryptoDeposits,
  submitCryptoDeposit,
} from "../services/cryptoDeposit.service.js";
import type { ListCryptoDepositsQuery, SubmitCryptoDepositInput } from "../validators/cryptoDeposit.schema.js";

export const getCryptoAssets = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const assets = await listCryptoAssets();
  res.json({ success: true, data: assets.map(toCryptoAssetSummary) });
});

export const submitCryptoDepositHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { assetId, amountCrypto, txHash, pin } = req.body as SubmitCryptoDepositInput;

  const request = await submitCryptoDeposit({
    userId: new Types.ObjectId(req.userId),
    assetId,
    amountCrypto,
    txHash: txHash || undefined,
    pin,
  });

  res.status(201).json({ success: true, data: toCryptoDepositSummary(request) });
});

export const getMyCryptoDepositsList = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as ListCryptoDepositsQuery;

  const result = await listMyCryptoDeposits({
    userId: new Types.ObjectId(req.userId),
    page,
    limit,
  });

  res.json({
    success: true,
    data: {
      items: result.items.map(toCryptoDepositSummary),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const getMyCryptoDepositDetail = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await getMyCryptoDeposit(new Types.ObjectId(req.userId), req.params.id!);
  res.json({ success: true, data: toCryptoDepositSummary(request) });
});
