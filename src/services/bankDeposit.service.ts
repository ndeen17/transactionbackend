import { Types, type FilterQuery } from "mongoose";
import { User } from "../models/user.model.js";
import { BankAccount } from "../models/bankAccount.model.js";
import { Transaction } from "../models/transaction.model.js";
import {
  BankDepositRequest,
  type BankDepositRequestDocument,
} from "../models/bankDepositRequest.model.js";
import { generateUniqueReference } from "./transactionReference.service.js";
import { verifyPin } from "./pin.service.js";
import { createNotification } from "./notification.service.js";
import { ApiError } from "../utils/ApiError.js";

interface SubmitBankDepositParams {
  userId: Types.ObjectId;
  bankAccountId: string;
  amountMinor: number;
  senderReference?: string;
  pin: string;
}

export async function submitBankDeposit({
  userId,
  bankAccountId,
  amountMinor,
  senderReference,
  pin,
}: SubmitBankDepositParams) {
  if (!Types.ObjectId.isValid(bankAccountId)) {
    throw new ApiError(400, "Choose a valid bank account", "INVALID_ACCOUNT");
  }

  const account = await BankAccount.findById(bankAccountId);
  if (!account) {
    throw new ApiError(400, "Choose a valid bank account", "INVALID_ACCOUNT");
  }

  await verifyPin({ userId, pin });

  const reference = await generateUniqueReference();

  const request = await BankDepositRequest.create({
    userId,
    bankAccountId: account._id,
    bankName: account.bankName,
    accountName: account.accountName,
    accountNumber: account.accountNumber,
    routingNumber: account.routingNumber,
    amountMinor,
    currency: "USD",
    senderReference: senderReference || undefined,
    reference,
    status: "pending",
  });

  await createNotification({
    userId: request.userId,
    type: "bank_deposit_initiated",
    title: "Deposit claim received",
    body: `We've received your bank deposit claim for ${(amountMinor / 100).toFixed(2)} USD. It's under review.`,
    link: `/dashboard/bank-deposits/${request._id.toString()}`,
  });

  return request;
}

interface ListMyBankDepositsParams {
  userId: Types.ObjectId;
  page: number;
  limit: number;
}

export async function listMyBankDeposits({ userId, page, limit }: ListMyBankDepositsParams) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    BankDepositRequest.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BankDepositRequest.countDocuments({ userId }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getMyBankDeposit(userId: Types.ObjectId, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const request = await BankDepositRequest.findOne({ _id: id, userId });
  if (!request) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  return request;
}

interface ListBankDepositRequestsParams {
  status?: BankDepositRequestDocument["status"];
  page: number;
  limit: number;
}

export async function listBankDepositRequests({ status, page, limit }: ListBankDepositRequestsParams) {
  const filter: FilterQuery<BankDepositRequestDocument> = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    BankDepositRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BankDepositRequest.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getBankDepositRequestDetail(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const request = await BankDepositRequest.findById(id);
  if (!request) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const submitter = await User.findById(request.userId);

  return { request, submitter };
}

// Approval is itself the confirmation (the admin already checked their real bank statement),
// so unlike the crypto flow there's no delay/sweeper — the credit happens inline here, as a
// two-step atomic sequence so a crash mid-sequence leaves the request visibly stuck in
// "crediting" rather than silently losing (or double-applying) the credit.
export async function acceptBankDeposit(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const claimed = await BankDepositRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: "crediting", reviewedAt: new Date() } },
    { new: true },
  );

  if (!claimed) {
    const exists = await BankDepositRequest.exists({ _id: id });
    if (!exists) throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
    throw new ApiError(409, "This request has already been reviewed.", "ALREADY_REVIEWED");
  }

  const amount = claimed.amountMinor / 100;

  const updatedUser = await User.findOneAndUpdate(
    { _id: claimed.userId },
    { $inc: { "account.balance": amount, "account.totalCredit": amount } },
    { new: true },
  );

  if (!updatedUser) {
    // Leave the request stuck in "crediting" rather than guessing — visibly wrong for
    // manual follow-up, same risk profile the crypto sweeper accepts.
    throw new ApiError(500, "Couldn't complete this deposit.", "CREDIT_FAILED");
  }

  const transaction = await Transaction.create({
    userId: claimed.userId,
    reference: claimed.reference,
    type: "bank_deposit",
    direction: "credit",
    status: "completed",
    simulated: true,
    amountMinor: claimed.amountMinor,
    currency: claimed.currency,
    narration: `Bank deposit — ${claimed.bankName}`,
    balanceAfterMinor: Math.round(updatedUser.account.balance * 100),
    bankDeposit: {
      bankName: claimed.bankName,
      accountName: claimed.accountName,
      accountNumber: claimed.accountNumber,
      routingNumber: claimed.routingNumber,
    },
  });

  claimed.status = "credited";
  claimed.creditedAt = new Date();
  claimed.transactionId = transaction._id;
  await claimed.save();

  await createNotification({
    userId: claimed.userId,
    type: "bank_deposit_approved",
    title: "Deposit approved",
    body: `Your bank deposit of ${(claimed.amountMinor / 100).toFixed(2)} ${claimed.currency} has been approved and added to your balance.`,
    link: `/dashboard/bank-deposits/${claimed._id.toString()}`,
  });

  return claimed;
}

export async function rejectBankDeposit(id: string, note?: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const request = await BankDepositRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: "rejected", reviewedAt: new Date(), adminNote: note || undefined } },
    { new: true },
  );

  if (!request) {
    const exists = await BankDepositRequest.exists({ _id: id });
    if (!exists) throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
    throw new ApiError(409, "This request has already been reviewed.", "ALREADY_REVIEWED");
  }

  await createNotification({
    userId: request.userId,
    type: "bank_deposit_rejected",
    title: "Deposit declined",
    body: note
      ? `Your bank deposit was declined: ${note}`
      : `Your bank deposit was declined. Contact support if you believe this is a mistake.`,
    link: `/dashboard/bank-deposits/${request._id.toString()}`,
  });

  return request;
}
