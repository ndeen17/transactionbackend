import { Types, type FilterQuery } from "mongoose";
import { User, type UserDocument } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";
import { generateUniqueReference } from "./transactionReference.service.js";
import { getKycDocumentUrl } from "./cloudinaryUpload.service.js";
import { sendAccountReinstatedEmail, sendAccountSuspendedEmail, sendKycApprovedEmail } from "./email.service.js";
import { ApiError } from "../utils/ApiError.js";
import type { ListAdminUsersQuery } from "../validators/admin.schema.js";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listUsers(query: ListAdminUsersQuery) {
  const filter: FilterQuery<UserDocument> = {};
  if (query.status) filter.status = query.status;
  if (query.kycStatus) filter["kyc.reviewStatus"] = query.kycStatus;

  if (query.search) {
    const pattern = new RegExp(escapeRegExp(query.search), "i");
    filter.$or = [
      { "personal.firstName": pattern },
      { "personal.lastName": pattern },
      { "contact.email": pattern },
      { "auth.loginId": pattern },
      { "account.accountNumber": pattern },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    User.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getUserDetail(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const kycDocumentUrl = getKycDocumentUrl(user.kyc.idDocumentPublicId, user.kyc.idDocumentResourceType);

  return { user, kycDocumentUrl };
}

export async function approveKyc(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  if (user.kyc.reviewStatus === "approved") {
    throw new ApiError(409, "This user is already verified.", "ALREADY_APPROVED");
  }

  user.kyc.reviewStatus = "approved";
  await user.save();

  await sendKycApprovedEmail({ to: user.contact.email, firstName: user.personal.firstName });

  return user;
}

export async function suspendUser(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  if (user.status === "suspended") {
    throw new ApiError(409, "This account is already suspended.", "ALREADY_SUSPENDED");
  }

  user.status = "suspended";
  await user.save();

  await sendAccountSuspendedEmail({ to: user.contact.email, firstName: user.personal.firstName });

  return user;
}

export async function unsuspendUser(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  if (user.status !== "suspended") {
    throw new ApiError(409, "This account is not suspended.", "NOT_SUSPENDED");
  }

  user.status = "active";
  await user.save();

  await sendAccountReinstatedEmail({ to: user.contact.email, firstName: user.personal.firstName });

  return user;
}

interface AdjustBalanceParams {
  userId: string;
  direction: "credit" | "debit";
  amountMinor: number;
  note?: string;
}

export async function adjustBalance({ userId, direction, amountMinor, note }: AdjustBalanceParams) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const amount = amountMinor / 100;
  const signedAmount = direction === "credit" ? amount : -amount;

  const filter: FilterQuery<UserDocument> =
    direction === "debit"
      ? { _id: userId, "account.balance": { $gte: amount } }
      : { _id: userId };

  const inc =
    direction === "credit"
      ? { "account.balance": signedAmount, "account.totalCredit": amount }
      : { "account.balance": signedAmount, "account.totalDebit": amount };

  const updatedUser = await User.findOneAndUpdate(filter, { $inc: inc }, { new: true });

  if (!updatedUser) {
    const exists = await User.exists({ _id: userId });
    if (!exists) throw new ApiError(404, "User not found", "NOT_FOUND");
    throw new ApiError(400, "This user's balance is too low for that debit.", "INSUFFICIENT_FUNDS");
  }

  const reference = await generateUniqueReference();

  const transaction = await Transaction.create({
    userId,
    reference,
    type: "adjustment",
    direction,
    status: "completed",
    simulated: true,
    amountMinor,
    currency: updatedUser.account.currency,
    narration: note || "Balance adjustment by admin",
    balanceAfterMinor: Math.round(updatedUser.account.balance * 100),
  });

  return { user: updatedUser, transaction };
}
