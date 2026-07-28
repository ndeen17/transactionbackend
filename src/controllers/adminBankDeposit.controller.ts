import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toAdminBankDepositSummary } from "../utils/bankDepositSummary.js";
import {
  acceptBankDeposit,
  getBankDepositRequestDetail,
  listBankDepositRequests,
  rejectBankDeposit,
} from "../services/bankDeposit.service.js";
import { User } from "../models/user.model.js";
import type { ListBankDepositsQuery, RejectBankDepositInput } from "../validators/bankDeposit.schema.js";

export const adminGetBankDeposits = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query as unknown as ListBankDepositsQuery;

  const result = await listBankDepositRequests({ status, page, limit });

  const submitterIds = [...new Set(result.items.map((item) => item.userId.toString()))];
  const submitters = await User.find({ _id: { $in: submitterIds } });
  const submitterById = new Map(submitters.map((u) => [u._id.toString(), u]));

  res.json({
    success: true,
    data: {
      items: result.items.map((item) =>
        toAdminBankDepositSummary(item, submitterById.get(item.userId.toString()) ?? null),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const adminGetBankDepositDetail = asyncHandler(async (req: Request, res: Response) => {
  const { request, submitter } = await getBankDepositRequestDetail(req.params.id!);
  res.json({ success: true, data: toAdminBankDepositSummary(request, submitter) });
});

export const adminAcceptBankDeposit = asyncHandler(async (req: Request, res: Response) => {
  const request = await acceptBankDeposit(req.params.id!);
  res.json({ success: true, data: { status: request.status } });
});

export const adminRejectBankDeposit = asyncHandler(async (req: Request, res: Response) => {
  const { note } = req.body as RejectBankDepositInput;
  const request = await rejectBankDeposit(req.params.id!, note || undefined);
  res.json({ success: true, data: { status: request.status } });
});
