import type { CryptoWithdrawalRequestDocument } from "../models/cryptoWithdrawalRequest.model.js";
import type { UserDocument } from "../models/user.model.js";

export function toCryptoWithdrawalSummary(request: CryptoWithdrawalRequestDocument) {
  return {
    id: request._id.toString(),
    symbol: request.symbol,
    amountCrypto: request.amountCrypto,
    priceUsdAtSubmission: request.priceUsdAtSubmission,
    walletAddress: request.walletAddress,
    network: request.network,
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

export type CryptoWithdrawalSummary = ReturnType<typeof toCryptoWithdrawalSummary>;

export function toAdminCryptoWithdrawalSummary(
  request: CryptoWithdrawalRequestDocument,
  submitter: UserDocument | null,
) {
  return {
    ...toCryptoWithdrawalSummary(request),
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
