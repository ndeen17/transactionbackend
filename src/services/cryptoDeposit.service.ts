import { Types, type FilterQuery } from "mongoose";
import { User } from "../models/user.model.js";
import { CryptoAsset } from "../models/cryptoAsset.model.js";
import {
  CryptoDepositRequest,
  type CryptoDepositRequestDocument,
} from "../models/cryptoDepositRequest.model.js";
import { generateUniqueReference } from "./transactionReference.service.js";
import { verifyPin } from "./pin.service.js";
import { createNotification } from "./notification.service.js";
import { getPriceUsd } from "./cryptoCatalog.service.js";
import { ApiError } from "../utils/ApiError.js";

export const CRYPTO_DEPOSIT_CREDIT_DELAY_MS = 60_000;

interface SubmitCryptoDepositParams {
  userId: Types.ObjectId;
  assetId: string;
  amountCrypto: number;
  txHash?: string;
  pin: string;
}

export async function submitCryptoDeposit({
  userId,
  assetId,
  amountCrypto,
  txHash,
  pin,
}: SubmitCryptoDepositParams) {
  if (!Types.ObjectId.isValid(assetId)) {
    throw new ApiError(400, "Choose a valid crypto asset", "INVALID_ASSET");
  }

  const asset = await CryptoAsset.findById(assetId);
  if (!asset) {
    throw new ApiError(400, "Choose a valid crypto asset", "INVALID_ASSET");
  }

  await verifyPin({ userId, pin });

  // Fetched only after PIN verification, so an unauthenticated attempt never triggers an
  // outbound API call. Fails closed — no request is created if a live price can't be had.
  const priceUsd = await getPriceUsd(asset.coingeckoId);
  const amountMinor = Math.round(amountCrypto * priceUsd * 100);

  const reference = await generateUniqueReference();

  const request = await CryptoDepositRequest.create({
    userId,
    cryptoAssetId: asset._id,
    symbol: asset.symbol,
    network: asset.network,
    address: asset.address,
    amountCrypto,
    amountMinor,
    priceUsdAtSubmission: priceUsd,
    currency: "USD",
    txHash: txHash || undefined,
    reference,
    status: "pending",
  });

  await createNotification({
    userId: request.userId,
    type: "crypto_deposit_initiated",
    title: "Deposit claim received",
    body: `We've received your ${request.symbol} deposit claim. It's under review.`,
    link: `/dashboard/crypto-deposits/${request._id.toString()}`,
  });

  return request;
}

interface ListMyCryptoDepositsParams {
  userId: Types.ObjectId;
  page: number;
  limit: number;
}

export async function listMyCryptoDeposits({ userId, page, limit }: ListMyCryptoDepositsParams) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CryptoDepositRequest.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CryptoDepositRequest.countDocuments({ userId }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getMyCryptoDeposit(userId: Types.ObjectId, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const request = await CryptoDepositRequest.findOne({ _id: id, userId });
  if (!request) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  return request;
}

interface ListCryptoDepositRequestsParams {
  status?: CryptoDepositRequestDocument["status"];
  page: number;
  limit: number;
}

export async function listCryptoDepositRequests({ status, page, limit }: ListCryptoDepositRequestsParams) {
  const filter: FilterQuery<CryptoDepositRequestDocument> = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CryptoDepositRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CryptoDepositRequest.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getCryptoDepositRequestDetail(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const request = await CryptoDepositRequest.findById(id);
  if (!request) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const submitter = await User.findById(request.userId);

  return { request, submitter };
}

export async function acceptCryptoDeposit(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const scheduledCreditAt = new Date(Date.now() + CRYPTO_DEPOSIT_CREDIT_DELAY_MS);

  const request = await CryptoDepositRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: "accepted", reviewedAt: new Date(), scheduledCreditAt } },
    { new: true },
  );

  if (!request) {
    const exists = await CryptoDepositRequest.exists({ _id: id });
    if (!exists) throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
    throw new ApiError(409, "This request has already been reviewed.", "ALREADY_REVIEWED");
  }

  await createNotification({
    userId: request.userId,
    type: "crypto_deposit_accepted",
    title: "Incoming crypto deposit",
    body: `Your ${request.symbol} deposit has been accepted and is being processed. It'll reflect in your balance shortly.`,
    link: `/dashboard/crypto-deposits/${request._id.toString()}`,
  });

  return request;
}

export async function rejectCryptoDeposit(id: string, note?: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
  }

  const request = await CryptoDepositRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: "rejected", reviewedAt: new Date(), adminNote: note || undefined } },
    { new: true },
  );

  if (!request) {
    const exists = await CryptoDepositRequest.exists({ _id: id });
    if (!exists) throw new ApiError(404, "Deposit request not found", "NOT_FOUND");
    throw new ApiError(409, "This request has already been reviewed.", "ALREADY_REVIEWED");
  }

  await createNotification({
    userId: request.userId,
    type: "crypto_deposit_rejected",
    title: "Crypto deposit declined",
    body: note
      ? `Your ${request.symbol} deposit was declined: ${note}`
      : `Your ${request.symbol} deposit was declined. Contact support if you believe this is a mistake.`,
    link: `/dashboard/crypto-deposits/${request._id.toString()}`,
  });

  return request;
}
