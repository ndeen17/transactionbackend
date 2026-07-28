import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toAdminBankWithdrawalSummary } from "../utils/bankWithdrawalSummary.js";
import {
  acceptBankWithdrawal,
  declineBankWithdrawal,
  getBankWithdrawalRequestDetail,
  listBankWithdrawalRequests,
} from "../services/bankWithdrawal.service.js";
import { User } from "../models/user.model.js";
import type { ListWithdrawalsQuery, DeclineWithdrawalInput } from "../validators/withdrawal.schema.js";

export const adminGetBankWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query as unknown as ListWithdrawalsQuery;

  const result = await listBankWithdrawalRequests({ status, page, limit });

  const submitterIds = [...new Set(result.items.map((item) => item.userId.toString()))];
  const submitters = await User.find({ _id: { $in: submitterIds } });
  const submitterById = new Map(submitters.map((u) => [u._id.toString(), u]));

  res.json({
    success: true,
    data: {
      items: result.items.map((item) =>
        toAdminBankWithdrawalSummary(item, submitterById.get(item.userId.toString()) ?? null),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const adminGetBankWithdrawalDetail = asyncHandler(async (req: Request, res: Response) => {
  const { request, submitter } = await getBankWithdrawalRequestDetail(req.params.id!);
  res.json({ success: true, data: toAdminBankWithdrawalSummary(request, submitter) });
});

export const adminAcceptBankWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const request = await acceptBankWithdrawal(req.params.id!);
  res.json({ success: true, data: { status: request.status } });
});

export const adminDeclineBankWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const { note } = req.body as DeclineWithdrawalInput;
  const request = await declineBankWithdrawal(req.params.id!, note || undefined);
  res.json({ success: true, data: { status: request.status } });
});
