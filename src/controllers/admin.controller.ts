import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { timingSafeEqualStrings } from "../utils/timingSafeEqual.js";
import { toAdminUserDetail, toAdminUserListItem } from "../utils/adminUserSummary.js";
import { toTransactionSummary } from "../utils/transactionSummary.js";
import { signAdminToken } from "../services/token.service.js";
import {
  adjustBalance,
  approveKyc,
  getUserDetail,
  listUsers,
  suspendUser,
  unsuspendUser,
} from "../services/admin.service.js";
import type { AdminLoginInput, BalanceAdjustmentInput, ListAdminUsersQuery } from "../validators/admin.schema.js";

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body as AdminLoginInput;

  if (!timingSafeEqualStrings(password, env.ADMIN_PASSWORD)) {
    throw new ApiError(401, "Incorrect password", "INVALID_PASSWORD");
  }

  res.json({ success: true, data: { token: signAdminToken() } });
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListAdminUsersQuery;
  const result = await listUsers(query);

  res.json({
    success: true,
    data: {
      items: result.items.map(toAdminUserListItem),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { user, kycDocumentUrl } = await getUserDetail(req.params.id!);
  res.json({ success: true, data: toAdminUserDetail(user, kycDocumentUrl) });
});

export const approveUserKyc = asyncHandler(async (req: Request, res: Response) => {
  const user = await approveKyc(req.params.id!);
  res.json({ success: true, data: { kycReviewStatus: user.kyc.reviewStatus } });
});

export const suspendUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await suspendUser(req.params.id!);
  res.json({ success: true, data: { status: user.status } });
});

export const unsuspendUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await unsuspendUser(req.params.id!);
  res.json({ success: true, data: { status: user.status } });
});

export const submitBalanceAdjustment = asyncHandler(async (req: Request, res: Response) => {
  const { direction, amount, note } = req.body as BalanceAdjustmentInput;

  const { user, transaction } = await adjustBalance({
    userId: req.params.id!,
    direction,
    amountMinor: amount,
    note: note || undefined,
  });

  res.status(201).json({
    success: true,
    data: {
      balance: user.account.balance,
      transaction: toTransactionSummary(transaction),
    },
  });
});
