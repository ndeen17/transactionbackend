import { Schema, model, type Document, type Types } from "mongoose";

export const TRANSACTION_TYPES = ["transfer", "deposit"] as const;
export const TRANSACTION_DIRECTIONS = ["debit", "credit"] as const;
export const TRANSACTION_STATUSES = ["completed", "failed"] as const;

export interface TransactionDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  reference: string;
  type: (typeof TRANSACTION_TYPES)[number];
  direction: (typeof TRANSACTION_DIRECTIONS)[number];
  status: (typeof TRANSACTION_STATUSES)[number];
  simulated: boolean;
  amountMinor: number;
  currency: string;
  narration?: string;
  balanceAfterMinor: number;
  recipient?: {
    name: string;
    bankName: string;
    accountNumber: string;
  };
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recipientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    bankName: { type: String, required: true, trim: true, maxlength: 120 },
    accountNumber: { type: String, required: true, trim: true, maxlength: 40 },
  },
  { _id: false },
);

const transactionSchema = new Schema<TransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reference: { type: String, required: true, trim: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    direction: { type: String, enum: TRANSACTION_DIRECTIONS, required: true },
    status: { type: String, enum: TRANSACTION_STATUSES, required: true },
    simulated: { type: Boolean, required: true, default: true },
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: "USD", maxlength: 3 },
    narration: { type: String, trim: true, maxlength: 200 },
    balanceAfterMinor: { type: Number, required: true },
    recipient: { type: recipientSchema },
    failureReason: { type: String },
  },
  { timestamps: true },
);

transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = model<TransactionDocument>("Transaction", transactionSchema);
