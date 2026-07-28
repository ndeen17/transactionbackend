import { Schema, model, type Document, type Types } from "mongoose";
import { WITHDRAWAL_STATUSES } from "./cryptoWithdrawalRequest.model.js";

export interface BankWithdrawalRequestDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
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

const bankWithdrawalRequestSchema = new Schema<BankWithdrawalRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bankName: { type: String, required: true, trim: true, maxlength: 80 },
    accountName: { type: String, required: true, trim: true, maxlength: 120 },
    accountNumber: { type: String, required: true, trim: true, maxlength: 40 },
    routingNumber: { type: String, trim: true, maxlength: 40 },
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

bankWithdrawalRequestSchema.index({ reference: 1 }, { unique: true });
bankWithdrawalRequestSchema.index({ userId: 1, createdAt: -1 });

export const BankWithdrawalRequest = model<BankWithdrawalRequestDocument>(
  "BankWithdrawalRequest",
  bankWithdrawalRequestSchema,
);
