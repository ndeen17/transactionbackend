import { Schema, model, type Document, type Types } from "mongoose";

export const CRYPTO_DEPOSIT_STATUSES = ["pending", "accepted", "rejected", "crediting", "credited"] as const;

export interface CryptoDepositRequestDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  cryptoAssetId: Types.ObjectId;
  symbol: string;
  network?: string;
  address: string;
  // Display-only — the amount of crypto the user claims to have sent. Never read by any
  // balance math; only amountMinor (the self-reported USD-equivalent) is ever credited.
  amountCrypto: number;
  amountMinor: number;
  // The live USD-per-unit price used to compute amountMinor at submission time — an audit
  // record of what rate was used, not re-read by any later balance math.
  priceUsdAtSubmission: number;
  currency: string;
  txHash?: string;
  reference: string;
  status: (typeof CRYPTO_DEPOSIT_STATUSES)[number];
  adminNote?: string;
  reviewedAt?: Date;
  // When the balance credit is due — set to now+60s on accept. This, not any in-memory
  // timer, is what makes the delayed credit durable across server restarts.
  scheduledCreditAt?: Date;
  creditedAt?: Date;
  transactionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cryptoDepositRequestSchema = new Schema<CryptoDepositRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cryptoAssetId: { type: Schema.Types.ObjectId, ref: "CryptoAsset", required: true },
    symbol: { type: String, required: true, trim: true },
    network: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    amountCrypto: { type: Number, required: true, min: 0 },
    amountMinor: { type: Number, required: true, min: 1 },
    priceUsdAtSubmission: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "USD", maxlength: 3 },
    txHash: { type: String, trim: true, maxlength: 200 },
    reference: { type: String, required: true, trim: true },
    status: { type: String, enum: CRYPTO_DEPOSIT_STATUSES, required: true, default: "pending" },
    adminNote: { type: String, trim: true, maxlength: 300 },
    reviewedAt: { type: Date },
    scheduledCreditAt: { type: Date },
    creditedAt: { type: Date },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true },
);

cryptoDepositRequestSchema.index({ reference: 1 }, { unique: true });
cryptoDepositRequestSchema.index({ userId: 1, createdAt: -1 });
cryptoDepositRequestSchema.index({ status: 1, scheduledCreditAt: 1 });

export const CryptoDepositRequest = model<CryptoDepositRequestDocument>(
  "CryptoDepositRequest",
  cryptoDepositRequestSchema,
);
