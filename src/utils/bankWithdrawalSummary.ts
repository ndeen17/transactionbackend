import type { BankWithdrawalRequestDocument } from "../models/bankWithdrawalRequest.model.js";
import type { UserDocument } from "../models/user.model.js";

export function toBankWithdrawalSummary(request: BankWithdrawalRequestDocument) {
  return {
    id: request._id.toString(),
    bankName: request.bankName,
    accountName: request.accountName,
    accountNumber: request.accountNumber,
    routingNumber: request.routingNumber,
    amount: request.amountMinor / 100,
    currency: request.currency,
    reference: request.reference,
    status: request.status,
    adminNote: request.adminNote,
    reviewedAt: request.reviewedAt,
    declinedAt: request.declinedAt,
    transactionId: request.transactionId.toString(),
    refundTransactionId: request.refundTransactionId?.toString(),
    createdAt: request.createdAt,
  };
}

export type BankWithdrawalSummary = ReturnType<typeof toBankWithdrawalSummary>;

export function toAdminBankWithdrawalSummary(
  request: BankWithdrawalRequestDocument,
  submitter: UserDocument | null,
) {
  return {
    ...toBankWithdrawalSummary(request),
    submitter: submitter
      ? {
          id: submitter._id.toString(),
          firstName: submitter.personal.firstName,
          lastName: submitter.personal.lastName,
          email: submitter.contact.email,
          loginId: submitter.auth.loginId,
        }
      : null,
  };
}
