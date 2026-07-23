import type { UserDocument } from "../models/user.model.js";

export function toUserSummary(user: UserDocument) {
  return {
    id: user._id.toString(),
    firstName: user.personal.firstName,
    lastName: user.personal.lastName,
    loginId: user.auth.loginId,
    accountType: user.accountType,
    status: user.status,
    kycReviewStatus: user.kyc.reviewStatus,
    account: {
      accountNumber: user.account.accountNumber,
      balance: user.account.balance,
      currency: user.account.currency,
      totalCredit: user.account.totalCredit,
      totalDebit: user.account.totalDebit,
    },
  };
}

export type UserSummary = ReturnType<typeof toUserSummary>;
