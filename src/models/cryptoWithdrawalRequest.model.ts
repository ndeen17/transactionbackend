import { Schema, model, type Document, type Types } from "mongoose";

// No standalone "accepted" state — same reasoning as bank deposits: the debit already
// happened at submission, so admin review just resolves to "completed" or "declined"
// (with "reversing" as the transient claim state during a decline's refund).
export const WITHDRAWAL_STATUSES = ["processing", "completed", "declined", "reversing"] as const;

export interface CryptoWithdrawalRequestDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  cryptoAssetId: Types.ObjectId;
  symbol: string;
  amountCrypto: number;
  priceUsdAtSubmission: number;
  walletAddress: string;
  network?: string;
  amountMinor: number;
  currency: string;
  reference: string;
  status: (typeof WITHDRAWAL_STATUSES)[number];
  adminNote?: string;
  reviewedAt?: Date;
  declinedAt?: Date;
  transactionId: Types.ObjectId;
  refundTransactionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cryptoWithdrawalRequestSchema = new Schema<CryptoWithdrawalRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cryptoAssetId: { type: Schema.Types.ObjectId, ref: "CryptoAsset", required: true },
    symbol: { type: String, required: true, trim: true },
    amountCrypto: { type: Number, required: true, min: 0 },
    priceUsdAtSubmission: { type: Number, required: true, min: 0 },
    walletAddress: { type: String, required: true, trim: true, maxlength: 200 },
    network: { type: String, trim: true, maxlength: 40 },
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: "USD", maxlength: 3 },
    reference: { type: String, required: true, trim: true },
    status: { type: String, enum: WITHDRAWAL_STATUSES, required: true, default: "processing" },
    adminNote: { type: String, trim: true, maxlength: 300 },
    reviewedAt: { type: Date },
    declinedAt: { type: Date },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    refundTransactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true },
);

cryptoWithdrawalRequestSchema.index({ reference: 1 }, { unique: true });
cryptoWithdrawalRequestSchema.index({ userId: 1, createdAt: -1 });

export const CryptoWithdrawalRequest = model<CryptoWithdrawalRequestDocument>(
  "CryptoWithdrawalRequest",
  cryptoWithdrawalRequestSchema,
);
