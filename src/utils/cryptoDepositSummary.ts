import type { CryptoDepositRequestDocument } from "../models/cryptoDepositRequest.model.js";
import type { UserDocument } from "../models/user.model.js";

export function toCryptoDepositSummary(request: CryptoDepositRequestDocument) {
  return {
    id: request._id.toString(),
    symbol: request.symbol,
    network: request.network,
    address: request.address,
    amountCrypto: request.amountCrypto,
    amount: request.amountMinor / 100,
    currency: request.currency,
    txHash: request.txHash,
    reference: request.reference,
    status: request.status,
    adminNote: request.adminNote,
    reviewedAt: request.reviewedAt,
    scheduledCreditAt: request.scheduledCreditAt,
    creditedAt: request.creditedAt,
    transactionId: request.transactionId?.toString(),
    createdAt: request.createdAt,
  };
}

export type CryptoDepositSummary = ReturnType<typeof toCryptoDepositSummary>;

export function toAdminCryptoDepositSummary(request: CryptoDepositRequestDocument, submitter: UserDocument | null) {
  return {
    ...toCryptoDepositSummary(request),
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
