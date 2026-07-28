import { Types, type FilterQuery } from "mongoose";
import { User } from "../models/user.model.js";
import { CryptoAsset } from "../models/cryptoAsset.model.js";
import { Transaction } from "../models/transaction.model.js";
import {
  CryptoWithdrawalRequest,
  type CryptoWithdrawalRequestDocument,
} from "../models/cryptoWithdrawalRequest.model.js";
import { generateUniqueReference } from "./transactionReference.service.js";
import { verifyPin } from "./pin.service.js";
import { createNotification } from "./notification.service.js";
import { getPriceUsd } from "./cryptoCatalog.service.js";
import { ApiError } from "../utils/ApiError.js";

interface SubmitCryptoWithdrawalParams {
  userId: Types.ObjectId;
  assetId: string;
  amountCrypto: number;
  walletAddress: string;
  network?: string;
  pin: string;
}

export async function submitCryptoWithdrawal({
  userId,
  assetId,
  amountCrypto,
  walletAddress,
  network,
  pin,
}: SubmitCryptoWithdrawalParams) {
  if (!Types.ObjectId.isValid(assetId)) {
    throw new ApiError(400, "Choose a valid crypto asset", "INVALID_ASSET");
  }

  const asset = await CryptoAsset.findById(assetId);
  if (!asset) {
    throw new ApiError(400, "Choose a valid crypto asset", "INVALID_ASSET");
  }

  await verifyPin({ userId, pin });

  const priceUsd = await getPriceUsd(asset.coingeckoId);
  const amountMinor = Math.round(amountCrypto * priceUsd * 100);
  const amount = amountMinor / 100;

  // Same atomic guarded debit as transferMoney — the balance check and the decrement
  // happen in one operation so a race can't let two withdrawals both pass a stale check.
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
    type: "crypto_withdrawal",
    direction: "debit",
    status: "completed",
    simulated: true,
    amountMinor,
    currency: updatedUser.account.currency,
    narration: `${asset.symbol} withdrawal`,
    balanceAfterMinor: Math.round(updatedUser.account.balance * 100),
    cryptoWithdrawal: { symbol: asset.symbol, network: network || undefined, amountCrypto, walletAddress },
  });

  const request = await CryptoWithdrawalRequest.create({
    userId,
    cryptoAssetId: asset._id,
    symbol: asset.symbol,
    amountCrypto,
    priceUsdAtSubmission: priceUsd,
    walletAddress,
    network: network || undefined,
    amountMinor,
    currency: updatedUser.account.currency,
    reference,
    status: "processing",
    transactionId: transaction._id,
  });

  await createNotification({
    userId,
    type: "crypto_withdrawal_processing",
    title: "Withdrawal processing",
    body: `Your ${asset.symbol} withdrawal of ${amount.toFixed(2)} ${updatedUser.account.currency} is processing and has been deducted from your balance.`,
    link: `/dashboard/crypto-withdrawals/${request._id.toString()}`,
  });

  return { request, transaction };
}

interface ListMyWithdrawalsParams {
  userId: Types.ObjectId;
  page: number;
  limit: number;
}

export async function listMyCryptoWithdrawals({ userId, page, limit }: ListMyWithdrawalsParams) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CryptoWithdrawalRequest.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CryptoWithdrawalRequest.countDocuments({ userId }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getMyCryptoWithdrawal(userId: Types.ObjectId, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const request = await CryptoWithdrawalRequest.findOne({ _id: id, userId });
  if (!request) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  return request;
}

interface ListWithdrawalRequestsParams {
  status?: CryptoWithdrawalRequestDocument["status"];
  page: number;
  limit: number;
}

export async function listCryptoWithdrawalRequests({ status, page, limit }: ListWithdrawalRequestsParams) {
  const filter: FilterQuery<CryptoWithdrawalRequestDocument> = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CryptoWithdrawalRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CryptoWithdrawalRequest.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getCryptoWithdrawalRequestDetail(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const request = await CryptoWithdrawalRequest.findById(id);
  if (!request) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const submitter = await User.findById(request.userId);

  return { request, submitter };
}

export async function acceptCryptoWithdrawal(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const request = await CryptoWithdrawalRequest.findOneAndUpdate(
    { _id: id, status: "processing" },
    { $set: { status: "completed", reviewedAt: new Date() } },
    { new: true },
  );

  if (!request) {
    const exists = await CryptoWithdrawalRequest.exists({ _id: id });
    if (!exists) throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
    throw new ApiError(409, "This request has already been reviewed.", "ALREADY_REVIEWED");
  }

  await createNotification({
    userId: request.userId,
    type: "crypto_withdrawal_completed",
    title: "Withdrawal completed",
    body: `Your ${request.symbol} withdrawal has been approved and completed.`,
    link: `/dashboard/crypto-withdrawals/${request._id.toString()}`,
  });

  return request;
}

// Refund is a two-step atomic sequence — claim ("reversing") then complete — for the same
// crash-safety reason the bank-deposit accept flow uses one: a crash mid-refund leaves the
// request visibly stuck rather than silently losing or double-applying the credit.
export async function declineCryptoWithdrawal(id: string, note?: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Withdrawal request not found", "NOT_FOUND");
  }

  const claimed = await CryptoWithdrawalRequest.findOneAndUpdate(
    { _id: id, status: "processing" },
    { $set: { status: "reversing", reviewedAt: new Date() } },
    { new: true },
  );

  if (!claimed) {
    const exists = await CryptoWithdrawalRequest.exists({ _id: id });
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
    type: "crypto_withdrawal",
    direction: "credit",
    status: "completed",
    simulated: true,
    amountMinor: claimed.amountMinor,
    currency: claimed.currency,
    narration: `${claimed.symbol} withdrawal declined — refunded`,
    balanceAfterMinor: Math.round(updatedUser.account.balance * 100),
    cryptoWithdrawal: {
      symbol: claimed.symbol,
      network: claimed.network,
      amountCrypto: claimed.amountCrypto,
      walletAddress: claimed.walletAddress,
    },
  });

  claimed.status = "declined";
  claimed.declinedAt = new Date();
  claimed.adminNote = note || undefined;
  claimed.refundTransactionId = refundTransaction._id;
  await claimed.save();

  await createNotification({
    userId: claimed.userId,
    type: "crypto_withdrawal_declined",
    title: "Withdrawal declined",
    body: note
      ? `Your ${claimed.symbol} withdrawal was declined and refunded: ${note}`
      : `Your ${claimed.symbol} withdrawal was declined and refunded to your balance.`,
    link: `/dashboard/crypto-withdrawals/${claimed._id.toString()}`,
  });

  return claimed;
}
