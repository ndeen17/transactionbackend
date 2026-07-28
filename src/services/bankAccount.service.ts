import { Types } from "mongoose";
import { BankAccount } from "../models/bankAccount.model.js";
import { ApiError } from "../utils/ApiError.js";
import type { CreateBankAccountInput, UpdateBankAccountInput } from "../validators/bankAccount.schema.js";

export async function listBankAccounts() {
  return BankAccount.find().sort({ bankName: 1 });
}

export async function createBankAccount(input: CreateBankAccountInput) {
  return BankAccount.create({
    bankName: input.bankName,
    accountName: input.accountName,
    accountNumber: input.accountNumber,
    routingNumber: input.routingNumber || undefined,
  });
}

export async function updateBankAccount(id: string, input: UpdateBankAccountInput) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Bank account not found", "NOT_FOUND");
  }

  const account = await BankAccount.findByIdAndUpdate(
    id,
    {
      $set: {
        bankName: input.bankName,
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        routingNumber: input.routingNumber || undefined,
      },
    },
    { new: true },
  );

  if (!account) {
    throw new ApiError(404, "Bank account not found", "NOT_FOUND");
  }

  return account;
}

export async function deleteBankAccount(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Bank account not found", "NOT_FOUND");
  }

  const account = await BankAccount.findByIdAndDelete(id);
  if (!account) {
    throw new ApiError(404, "Bank account not found", "NOT_FOUND");
  }
}
