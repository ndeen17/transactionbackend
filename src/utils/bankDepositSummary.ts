import type { BankDepositRequestDocument } from "../models/bankDepositRequest.model.js";
import type { UserDocument } from "../models/user.model.js";

export function toBankDepositSummary(request: BankDepositRequestDocument) {
  return {
    id: request._id.toString(),
    bankName: request.bankName,
    accountName: request.accountName,
    accountNumber: request.accountNumber,
    routingNumber: request.routingNumber,
    amount: request.amountMinor / 100,
    currency: request.currency,
    senderReference: request.senderReference,
    reference: request.reference,
    status: request.status,
    adminNote: request.adminNote,
    reviewedAt: request.reviewedAt,
    creditedAt: request.creditedAt,
    transactionId: request.transactionId?.toString(),
    createdAt: request.createdAt,
  };
}

export type BankDepositSummary = ReturnType<typeof toBankDepositSummary>;

export function toAdminBankDepositSummary(request: BankDepositRequestDocument, submitter: UserDocument | null) {
  return {
    ...toBankDepositSummary(request),
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
