import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toAdminCryptoDepositSummary } from "../utils/cryptoDepositSummary.js";
import {
  acceptCryptoDeposit,
  getCryptoDepositRequestDetail,
  listCryptoDepositRequests,
  rejectCryptoDeposit,
} from "../services/cryptoDeposit.service.js";
import { User } from "../models/user.model.js";
import type { ListCryptoDepositsQuery, RejectCryptoDepositInput } from "../validators/cryptoDeposit.schema.js";

export const adminGetCryptoDeposits = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query as unknown as ListCryptoDepositsQuery;

  const result = await listCryptoDepositRequests({ status, page, limit });

  const submitterIds = [...new Set(result.items.map((item) => item.userId.toString()))];
  const submitters = await User.find({ _id: { $in: submitterIds } });
  const submitterById = new Map(submitters.map((u) => [u._id.toString(), u]));

  res.json({
    success: true,
    data: {
      items: result.items.map((item) =>
        toAdminCryptoDepositSummary(item, submitterById.get(item.userId.toString()) ?? null),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const adminGetCryptoDepositDetail = asyncHandler(async (req: Request, res: Response) => {
  const { request, submitter } = await getCryptoDepositRequestDetail(req.params.id!);
  res.json({ success: true, data: toAdminCryptoDepositSummary(request, submitter) });
});

export const adminAcceptCryptoDeposit = asyncHandler(async (req: Request, res: Response) => {
  const request = await acceptCryptoDeposit(req.params.id!);
  res.json({ success: true, data: { status: request.status, scheduledCreditAt: request.scheduledCreditAt } });
});

export const adminRejectCryptoDeposit = asyncHandler(async (req: Request, res: Response) => {
  const { note } = req.body as RejectCryptoDepositInput;
  const request = await rejectCryptoDeposit(req.params.id!, note || undefined);
  res.json({ success: true, data: { status: request.status } });
});
