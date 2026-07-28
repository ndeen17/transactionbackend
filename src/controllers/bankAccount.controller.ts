import type { Response } from "express";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toBankAccountSummary } from "../utils/bankAccountSummary.js";
import { listBankAccounts } from "../services/bankAccount.service.js";

export const getBankAccounts = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const accounts = await listBankAccounts();
  res.json({ success: true, data: accounts.map(toBankAccountSummary) });
});
