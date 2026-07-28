import { Types } from "mongoose";
import { CryptoAsset } from "../models/cryptoAsset.model.js";
import { getCatalog } from "./cryptoCatalog.service.js";
import { ApiError } from "../utils/ApiError.js";
import type { CreateCryptoAssetInput, UpdateCryptoAssetInput } from "../validators/cryptoAsset.schema.js";

export async function listCryptoAssets() {
  return CryptoAsset.find().sort({ symbol: 1, network: 1 });
}

export async function createCryptoAsset(input: CreateCryptoAssetInput) {
  const catalog = await getCatalog();
  const coin = catalog.find((c) => c.coingeckoId === input.coingeckoId);
  if (!coin) {
    throw new ApiError(400, "Choose a valid crypto asset", "INVALID_ASSET");
  }

  return CryptoAsset.create({
    coingeckoId: coin.coingeckoId,
    symbol: coin.symbol,
    name: coin.name,
    network: input.network || undefined,
    address: input.address,
  });
}

export async function updateCryptoAsset(id: string, input: UpdateCryptoAssetInput) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Crypto asset not found", "NOT_FOUND");
  }

  const asset = await CryptoAsset.findByIdAndUpdate(
    id,
    {
      $set: {
        network: input.network || undefined,
        address: input.address,
      },
    },
    { new: true },
  );

  if (!asset) {
    throw new ApiError(404, "Crypto asset not found", "NOT_FOUND");
  }

  return asset;
}

export async function deleteCryptoAsset(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Crypto asset not found", "NOT_FOUND");
  }

  const asset = await CryptoAsset.findByIdAndDelete(id);
  if (!asset) {
    throw new ApiError(404, "Crypto asset not found", "NOT_FOUND");
  }
}
