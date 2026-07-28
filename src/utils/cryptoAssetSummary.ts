import type { CryptoAssetDocument } from "../models/cryptoAsset.model.js";

export function toCryptoAssetSummary(asset: CryptoAssetDocument) {
  return {
    id: asset._id.toString(),
    coingeckoId: asset.coingeckoId,
    symbol: asset.symbol,
    name: asset.name,
    network: asset.network,
    address: asset.address,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

export type CryptoAssetSummary = ReturnType<typeof toCryptoAssetSummary>;
