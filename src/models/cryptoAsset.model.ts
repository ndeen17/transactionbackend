import { Schema, model, type Document, type Types } from "mongoose";

export interface CryptoAssetDocument extends Document {
  _id: Types.ObjectId;
  coingeckoId: string;
  symbol: string;
  name: string;
  network?: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const cryptoAssetSchema = new Schema<CryptoAssetDocument>(
  {
    coingeckoId: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true, uppercase: true, maxlength: 10 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    network: { type: String, trim: true, maxlength: 40 },
    address: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

cryptoAssetSchema.index({ symbol: 1, network: 1 });

export const CryptoAsset = model<CryptoAssetDocument>("CryptoAsset", cryptoAssetSchema);
