import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toBankAccountSummary } from "../utils/bankAccountSummary.js";
import {
  createBankAccount,
  deleteBankAccount,
  listBankAccounts,
  updateBankAccount,
} from "../services/bankAccount.service.js";
import type { CreateBankAccountInput, UpdateBankAccountInput } from "../validators/bankAccount.schema.js";

export const adminGetBankAccounts = asyncHandler(async (_req: Request, res: Response) => {
  const accounts = await listBankAccounts();
  res.json({ success: true, data: accounts.map(toBankAccountSummary) });
});

export const adminCreateBankAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await createBankAccount(req.body as CreateBankAccountInput);
  res.status(201).json({ success: true, data: toBankAccountSummary(account) });
});

export const adminUpdateBankAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await updateBankAccount(req.params.id!, req.body as UpdateBankAccountInput);
  res.json({ success: true, data: toBankAccountSummary(account) });
});

export const adminDeleteBankAccount = asyncHandler(async (req: Request, res: Response) => {
  await deleteBankAccount(req.params.id!);
  res.json({ success: true, data: { message: "Bank account deleted." } });
});
