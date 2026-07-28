import type { BankAccountDocument } from "../models/bankAccount.model.js";

export function toBankAccountSummary(account: BankAccountDocument) {
  return {
    id: account._id.toString(),
    bankName: account.bankName,
    accountName: account.accountName,
    accountNumber: account.accountNumber,
    routingNumber: account.routingNumber,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export type BankAccountSummary = ReturnType<typeof toBankAccountSummary>;
