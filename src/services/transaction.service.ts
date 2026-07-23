import { Types } from "mongoose";
import { User } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";
import { generateUniqueReference } from "./transactionReference.service.js";
import { verifyPin } from "./pin.service.js";
import { ApiError } from "../utils/ApiError.js";

interface TransferParams {
  userId: Types.ObjectId;
  amountMinor: number;
  narration?: string;
  pin: string;
  recipient: { name: string; bankName: string; accountNumber: string };
}

export async function transferMoney({ userId, amountMinor, narration, pin, recipient }: TransferParams) {
  await verifyPin({ userId, pin });

  const amount = amountMinor / 100;

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, status: "active", "account.balance": { $gte: amount } },
    { $inc: { "account.balance": -amount, "account.totalDebit": amount } },
    { new: true },
  );

  if (!updatedUser) {
    throw new ApiError(400, "Insufficient balance for this transfer.", "INSUFFICIENT_FUNDS");
  }

  const reference = await generateUniqueReference();

  const transaction = await Transaction.create({
    userId,
    reference,
    type: "transfer",
    direction: "debit",
    status: "completed",
    simulated: true,
    amountMinor,
    currency: updatedUser.account.currency,
    narration,
    balanceAfterMinor: Math.round(updatedUser.account.balance * 100),
    recipient,
  });

  return transaction;
}

interface DepositParams {
  userId: Types.ObjectId;
  amountMinor: number;
  pin: string;
}

export async function depositMoney({ userId, amountMinor, pin }: DepositParams) {
  await verifyPin({ userId, pin });

  const amount = amountMinor / 100;

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, status: "active" },
    { $inc: { "account.balance": amount, "account.totalCredit": amount } },
    { new: true },
  );

  if (!updatedUser) {
    throw new ApiError(400, "Unable to process this deposit.", "DEPOSIT_FAILED");
  }

  const reference = await generateUniqueReference();

  const transaction = await Transaction.create({
    userId,
    reference,
    type: "deposit",
    direction: "credit",
    status: "completed",
    simulated: true,
    amountMinor,
    currency: updatedUser.account.currency,
    narration: "Deposit to own account",
    balanceAfterMinor: Math.round(updatedUser.account.balance * 100),
  });

  return transaction;
}

interface ListParams {
  userId: Types.ObjectId;
  page: number;
  limit: number;
}

export async function listTransactions({ userId, page, limit }: ListParams) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Transaction.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments({ userId }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getTransactionForUser(userId: Types.ObjectId, transactionId: string) {
  if (!Types.ObjectId.isValid(transactionId)) {
    throw new ApiError(404, "Transaction not found", "NOT_FOUND");
  }

  const transaction = await Transaction.findOne({ _id: transactionId, userId });
  if (!transaction) {
    throw new ApiError(404, "Transaction not found", "NOT_FOUND");
  }

  return transaction;
}
