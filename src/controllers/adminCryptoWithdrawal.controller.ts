import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toAdminCryptoWithdrawalSummary } from "../utils/cryptoWithdrawalSummary.js";
import {
  acceptCryptoWithdrawal,
  declineCryptoWithdrawal,
  getCryptoWithdrawalRequestDetail,
  listCryptoWithdrawalRequests,
} from "../services/cryptoWithdrawal.service.js";
import { User } from "../models/user.model.js";
import type { ListWithdrawalsQuery, DeclineWithdrawalInput } from "../validators/withdrawal.schema.js";

export const adminGetCryptoWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query as unknown as ListWithdrawalsQuery;

  const result = await listCryptoWithdrawalRequests({ status, page, limit });

  const submitterIds = [...new Set(result.items.map((item) => item.userId.toString()))];
  const submitters = await User.find({ _id: { $in: submitterIds } });
  const submitterById = new Map(submitters.map((u) => [u._id.toString(), u]));

  res.json({
    success: true,
    data: {
      items: result.items.map((item) =>
        toAdminCryptoWithdrawalSummary(item, submitterById.get(item.userId.toString()) ?? null),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const adminGetCryptoWithdrawalDetail = asyncHandler(async (req: Request, res: Response) => {
  const { request, submitter } = await getCryptoWithdrawalRequestDetail(req.params.id!);
  res.json({ success: true, data: toAdminCryptoWithdrawalSummary(request, submitter) });
});

export const adminAcceptCryptoWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const request = await acceptCryptoWithdrawal(req.params.id!);
  res.json({ success: true, data: { status: request.status } });
});

export const adminDeclineCryptoWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const { note } = req.body as DeclineWithdrawalInput;
  const request = await declineCryptoWithdrawal(req.params.id!, note || undefined);
  res.json({ success: true, data: { status: request.status } });
});
