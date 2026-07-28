import { Types, type FilterQuery } from "mongoose";
import { User } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";
import {
  BankWithdrawalRequest,
  type BankWithdrawalRequestDocument,
} from "../models/bankWithdrawalRequest.model.js";
import { generateUniqueReference } from "./transactionReference.service.js";
import { verifyPin } from "./pin.service.js";
import { createNotification } from "./notification.service.js";
import { ApiError } from "../utils/ApiError.js";

interface SubmitBankWithdrawalParams {
  userId: Types.ObjectId;
  amountMinor: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  pin: string;
}

export async function submitBankWithdrawal({
  userId,
  amountMinor,
  bankName,
  accountName,
  accountNumber,
  routingNumber,
  pin,
}: SubmitBankWithdrawalParams) {
  await verifyPin({ userId, pin });

  const amount = amountMinor / 100;

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, status: "active", "account.balance": { $gte: amount } },
    { $inc: { "account.balance": -amount, "account.totalDebit": amount } },
    { new: true },
  );

  if (!updatedUser) {
    throw new ApiError(400, "Insufficient balance for this withdrawal.", "INSUFFICIENT_FUNDS");
  }

  const reference = await generateUniqueReference();

  const transaction = await Transaction.create({
    userId,
    reference,
    type: "bank_withdrawal",
    direction: "debit",
    status: "completed",
    simulated: true,
    amountMinor,
    currency: updatedUser.account.currency,
    narration: `Withdrawal to ${bankName}`,
    balanceAfterMinor: Math.round(updatedUser.account.balance * 100),
    bankWithdrawal: { bankName, accountName, accountNumber, routingNumber: routingNumber || undefined },
  });

  const request = await BankWithdrawalRequest.create({
    userId,
    bankName,
    accountName,
    accountNumber,
    routingNumber: routingNumber || undefined,
    amountMinor,
    currency: updatedUser.account.currency,
    reference,
    status: "processing",
    transactionId: transaction._id,
  });

  await createNotification({
    userId,
    type: "bank_withdrawal_processing",
    title: "Withdrawal processing",
    body: `Your bank withdrawal of ${amount.toFixed(2)} ${updatedUser.account.currency} is processing and has been deducted from your balance.`,
    link: `/dashboard/bank-withdrawals/${request._id.toString()}`,
  });

  return { request, transaction };
}

interface ListMyWithdrawalsParams {
  userId: Types.ObjectId;
  page: number;
  limit: number;
}

export async function listMyBankWithdrawals({ userId, page, limit }: ListMyWithdrawalsParams) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    BankWithdrawalRequest.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BankWithdrawalRequest.countDocuments({ userId }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getMyBankWithdrawal(userId: Types.ObjectId, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const request = await BankWithdrawalRequest.findOne({ _id: id, userId });
  if (!request) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  return request;
}

interface ListWithdrawalRequestsParams {
  status?: BankWithdrawalRequestDocument["status"];
  page: number;
  limit: number;
}

export async function listBankWithdrawalRequests({ status, page, limit }: ListWithdrawalRequestsParams) {
  const filter: FilterQuery<BankWithdrawalRequestDocument> = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    BankWithdrawalRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BankWithdrawalRequest.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getBankWithdrawalRequestDetail(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const request = await BankWithdrawalRequest.findById(id);
  if (!request) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const submitter = await User.findById(request.userId);

  return { request, submitter };
}

export async function acceptBankWithdrawal(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const request = await BankWithdrawalRequest.findOneAndUpdate(
    { _id: id, status: "processing" },
    { $set: { status: "completed", reviewedAt: new Date() } },
    { new: true },
  );

  if (!request) {
    const exists = await BankWithdrawalRequest.exists({ _id: id });
    if (!exists) throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
    throw new ApiError(409, "This request has already been reviewed.", "ALREADY_REVIEWED");
  }

  await createNotification({
    userId: request.userId,
    type: "bank_withdrawal_completed",
    title: "Withdrawal completed",
    body: `Your bank withdrawal has been approved and completed.`,
    link: `/dashboard/bank-withdrawals/${request._id.toString()}`,
  });

  return request;
}

export async function declineBankWithdrawal(id: string, note?: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const claimed = await BankWithdrawalRequest.findOneAndUpdate(
    { _id: id, status: "processing" },
    { $set: { status: "reversing", reviewedAt: new Date() } },
    { new: true },
  );

  if (!claimed) {
    const exists = await BankWithdrawalRequest.exists({ _id: id });
    if (!exists) throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
    throw new ApiError(409, "This request has already been reviewed.", "ALREADY_REVIEWED");
  }

  const amount = claimed.amountMinor / 100;

  const updatedUser = await User.findOneAndUpdate(
    { _id: claimed.userId },
    { $inc: { "account.balance": amount, "account.totalCredit": amount } },
    { new: true },
  );

  if (!updatedUser) {
    throw new ApiError(500, "Couldn't complete this refund.", "REFUND_FAILED");
  }

  const refundReference = await generateUniqueReference();

  const refundTransaction = await Transaction.create({
    userId: claimed.userId,
    reference: refundReference,
    type: "bank_withdrawal",
    direction: "credit",
    status: "completed",
    simulated: true,
    amountMinor: claimed.amountMinor,
    currency: claimed.currency,
    narration: `Withdrawal to ${claimed.bankName} declined — refunded`,
    balanceAfterMinor: Math.round(updatedUser.account.balance * 100),
    bankWithdrawal: {
      bankName: claimed.bankName,
      accountName: claimed.accountName,
      accountNumber: claimed.accountNumber,
      routingNumber: claimed.routingNumber,
    },
  });

  claimed.status = "declined";
  claimed.declinedAt = new Date();
  claimed.adminNote = note || undefined;
  claimed.refundTransactionId = refundTransaction._id;
  await claimed.save();

  await createNotification({
    userId: claimed.userId,
    type: "bank_withdrawal_declined",
    title: "Withdrawal declined",
    body: note
      ? `Your bank withdrawal was declined and refunded: ${note}`
      : `Your bank withdrawal was declined and refunded to your balance.`,
    link: `/dashboard/bank-withdrawals/${claimed._id.toString()}`,
  });

  return claimed;
}
