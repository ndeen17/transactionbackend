import { Schema, model, type Document, type Types } from "mongoose";

export const TRANSACTION_TYPES = [
  "transfer",
  "deposit",
  "adjustment",
  "crypto_deposit",
  "bank_deposit",
  "crypto_withdrawal",
  "bank_withdrawal",
] as const;
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
  crypto?: {
    symbol: string;
    network?: string;
    amountCrypto: number;
    address: string;
    txHash?: string;
  };
  bankDeposit?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
  };
  cryptoWithdrawal?: {
    symbol: string;
    network?: string;
    amountCrypto: number;
    walletAddress: string;
  };
  bankWithdrawal?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
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

const cryptoSchema = new Schema(
  {
    symbol: { type: String, required: true, trim: true },
    network: { type: String, trim: true },
    amountCrypto: { type: Number, required: true, min: 0 },
    address: { type: String, required: true, trim: true },
    txHash: { type: String, trim: true },
  },
  { _id: false },
);

const bankDepositSchema = new Schema(
  {
    bankName: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    routingNumber: { type: String, trim: true },
  },
  { _id: false },
);

const cryptoWithdrawalSchema = new Schema(
  {
    symbol: { type: String, required: true, trim: true },
    network: { type: String, trim: true },
    amountCrypto: { type: Number, required: true, min: 0 },
    walletAddress: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const bankWithdrawalSchema = new Schema(
  {
    bankName: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    routingNumber: { type: String, trim: true },
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
    crypto: { type: cryptoSchema },
    bankDeposit: { type: bankDepositSchema },
    cryptoWithdrawal: { type: cryptoWithdrawalSchema },
    bankWithdrawal: { type: bankWithdrawalSchema },
    failureReason: { type: String },
  },
  { timestamps: true },
);

transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = model<TransactionDocument>("Transaction", transactionSchema);
