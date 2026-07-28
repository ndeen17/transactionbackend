import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCryptoAssetSummary } from "../utils/cryptoAssetSummary.js";
import {
  createCryptoAsset,
  deleteCryptoAsset,
  listCryptoAssets,
  updateCryptoAsset,
} from "../services/cryptoAsset.service.js";
import { getCatalog } from "../services/cryptoCatalog.service.js";
import type { CreateCryptoAssetInput, UpdateCryptoAssetInput } from "../validators/cryptoAsset.schema.js";

export const adminGetCryptoAssets = asyncHandler(async (_req: Request, res: Response) => {
  const assets = await listCryptoAssets();
  res.json({ success: true, data: assets.map(toCryptoAssetSummary) });
});

export const adminGetCryptoCatalog = asyncHandler(async (_req: Request, res: Response) => {
  const catalog = await getCatalog();
  res.json({
    success: true,
    data: catalog.map((coin) => ({ coingeckoId: coin.coingeckoId, symbol: coin.symbol, name: coin.name })),
  });
});

export const adminCreateCryptoAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await createCryptoAsset(req.body as CreateCryptoAssetInput);
  res.status(201).json({ success: true, data: toCryptoAssetSummary(asset) });
});

export const adminUpdateCryptoAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await updateCryptoAsset(req.params.id!, req.body as UpdateCryptoAssetInput);
  res.json({ success: true, data: toCryptoAssetSummary(asset) });
});

export const adminDeleteCryptoAsset = asyncHandler(async (req: Request, res: Response) => {
  await deleteCryptoAsset(req.params.id!);
  res.json({ success: true, data: { message: "Crypto asset deleted." } });
});
