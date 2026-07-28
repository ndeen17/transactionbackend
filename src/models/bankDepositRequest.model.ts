import { Schema, model, type Document, type Types } from "mongoose";

// No standalone "accepted" state — approval credits immediately (see acceptBankDeposit),
// so a request goes straight from "pending" to the transient "crediting" then "credited".
export const BANK_DEPOSIT_STATUSES = ["pending", "rejected", "crediting", "credited"] as const;

export interface BankDepositRequestDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bankAccountId: Types.ObjectId;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  amountMinor: number;
  currency: string;
  senderReference?: string;
  reference: string;
  status: (typeof BANK_DEPOSIT_STATUSES)[number];
  adminNote?: string;
  reviewedAt?: Date;
  creditedAt?: Date;
  transactionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bankDepositRequestSchema = new Schema<BankDepositRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bankAccountId: { type: Schema.Types.ObjectId, ref: "BankAccount", required: true },
    bankName: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    routingNumber: { type: String, trim: true },
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: "USD", maxlength: 3 },
    senderReference: { type: String, trim: true, maxlength: 200 },
    reference: { type: String, required: true, trim: true },
    status: { type: String, enum: BANK_DEPOSIT_STATUSES, required: true, default: "pending" },
    adminNote: { type: String, trim: true, maxlength: 300 },
    reviewedAt: { type: Date },
    creditedAt: { type: Date },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true },
);

bankDepositRequestSchema.index({ reference: 1 }, { unique: true });
bankDepositRequestSchema.index({ userId: 1, createdAt: -1 });

export const BankDepositRequest = model<BankDepositRequestDocument>(
  "BankDepositRequest",
  bankDepositRequestSchema,
);
