import type { UserDocument } from "../models/user.model.js";

export function toAdminUserListItem(user: UserDocument) {
  return {
    id: user._id.toString(),
    firstName: user.personal.firstName,
    lastName: user.personal.lastName,
    email: user.contact.email,
    loginId: user.auth.loginId,
    accountType: user.accountType,
    status: user.status,
    kycReviewStatus: user.kyc.reviewStatus,
    balance: user.account.balance,
    currency: user.account.currency,
    createdAt: user.createdAt,
  };
}

export function toAdminUserDetail(user: UserDocument, kycDocumentUrl: string) {
  return {
    id: user._id.toString(),
    firstName: user.personal.firstName,
    lastName: user.personal.lastName,
    dateOfBirth: user.personal.dateOfBirth,
    gender: user.personal.gender,
    nationality: user.personal.nationality,
    email: user.contact.email,
    phone: user.contact.phone,
    address: user.contact.address,
    loginId: user.auth.loginId,
    accountType: user.accountType,
    status: user.status,
    kyc: {
      idType: user.kyc.idType,
      idNumber: user.kyc.idNumber,
      reviewStatus: user.kyc.reviewStatus,
      documentUrl: kycDocumentUrl,
      documentMimeType: user.kyc.idDocumentMimeType,
    },
    account: {
      accountNumber: user.account.accountNumber,
      balance: user.account.balance,
      currency: user.account.currency,
      totalCredit: user.account.totalCredit,
      totalDebit: user.account.totalDebit,
    },
    createdAt: user.createdAt,
  };
}
