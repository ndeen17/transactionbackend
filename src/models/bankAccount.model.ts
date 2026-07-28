import { Schema, model, type Document, type Types } from "mongoose";

export interface BankAccountDocument extends Document {
  _id: Types.ObjectId;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bankAccountSchema = new Schema<BankAccountDocument>(
  {
    bankName: { type: String, required: true, trim: true, maxlength: 80 },
    accountName: { type: String, required: true, trim: true, maxlength: 120 },
    accountNumber: { type: String, required: true, trim: true, maxlength: 40 },
    routingNumber: { type: String, trim: true, maxlength: 40 },
  },
  { timestamps: true },
);

export const BankAccount = model<BankAccountDocument>("BankAccount", bankAccountSchema);
