import { Schema, model, type Document, type Types } from "mongoose";

export const ACCOUNT_TYPES = ["savings", "current"] as const;
export const GENDERS = ["male", "female", "other", "prefer_not_to_say"] as const;
export const MARITAL_STATUSES = [
  "single",
  "married",
  "divorced",
  "widowed",
  "separated",
] as const;
export const ID_TYPES = ["passport", "drivers_license", "national_id"] as const;
export const KYC_REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export const USER_STATUSES = [
  "pending_verification",
  "active",
  "suspended",
  "closed",
] as const;

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  accountType: (typeof ACCOUNT_TYPES)[number];
  personal: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: Date;
    gender: (typeof GENDERS)[number];
    nationality: string;
    maritalStatus?: (typeof MARITAL_STATUSES)[number];
  };
  contact: {
    email: string;
    phone: string;
    address: {
      line1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  kyc: {
    idType: (typeof ID_TYPES)[number];
    idNumber: string;
    idDocumentPublicId: string;
    idDocumentResourceType: string;
    idDocumentOriginalName?: string;
    idDocumentMimeType?: string;
    reviewStatus: (typeof KYC_REVIEW_STATUSES)[number];
  };
  auth: {
    loginId: string;
    passwordHash: string;
    pinHash?: string;
    pinSetAt?: Date | null;
    pinFailedAttempts: number;
    pinLockedUntil?: Date | null;
  };
  account: {
    accountNumber: string;
    balance: number;
    currency: string;
    totalCredit: number;
    totalDebit: number;
  };
  consents: {
    termsAccepted: boolean;
    privacyPolicyAccepted: boolean;
    electronicCommsConsent: boolean;
    dataProcessingConsent: boolean;
    amlDeclaration: boolean;
    consentedAt: Date;
  };
  status: (typeof USER_STATUSES)[number];
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 2 },
  },
  { _id: false },
);

const userSchema = new Schema<UserDocument>(
  {
    accountType: { type: String, enum: ACCOUNT_TYPES, required: true },

    personal: {
      firstName: { type: String, required: true, trim: true, maxlength: 60 },
      middleName: { type: String, trim: true, maxlength: 60 },
      lastName: { type: String, required: true, trim: true, maxlength: 60 },
      dateOfBirth: { type: Date, required: true },
      gender: { type: String, enum: GENDERS, required: true },
      nationality: { type: String, required: true, trim: true, maxlength: 2 },
      maritalStatus: { type: String, enum: MARITAL_STATUSES },
    },

    contact: {
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 254,
      },
      phone: { type: String, required: true, trim: true, maxlength: 20 },
      address: { type: addressSchema, required: true },
    },

    kyc: {
      idType: { type: String, enum: ID_TYPES, required: true },
      idNumber: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
      idDocumentPublicId: { type: String, required: true },
      idDocumentResourceType: { type: String, required: true },
      idDocumentOriginalName: { type: String },
      idDocumentMimeType: { type: String },
      reviewStatus: { type: String, enum: KYC_REVIEW_STATUSES, default: "pending" },
    },

    auth: {
      loginId: { type: String, required: true, trim: true, maxlength: 40 },
      passwordHash: { type: String, required: true, select: false },
      pinHash: { type: String, select: false },
      pinSetAt: { type: Date, default: null },
      pinFailedAttempts: { type: Number, required: true, default: 0 },
      pinLockedUntil: { type: Date, default: null },
    },

    account: {
      accountNumber: { type: String, required: true, trim: true },
      balance: { type: Number, required: true, default: 0 },
      currency: { type: String, required: true, default: "USD", maxlength: 3 },
      totalCredit: { type: Number, required: true, default: 0 },
      totalDebit: { type: Number, required: true, default: 0 },
    },

    consents: {
      termsAccepted: { type: Boolean, required: true },
      privacyPolicyAccepted: { type: Boolean, required: true },
      electronicCommsConsent: { type: Boolean, required: true },
      dataProcessingConsent: { type: Boolean, required: true },
      amlDeclaration: { type: Boolean, required: true },
      consentedAt: { type: Date, required: true, default: Date.now },
    },

    status: { type: String, enum: USER_STATUSES, default: "pending_verification" },
    emailVerifiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const obj = ret as Record<string, any>;
        if (obj.auth) {
          delete obj.auth.passwordHash;
          delete obj.auth.pinHash;
        }
        delete obj.__v;
        return obj;
      },
    },
  },
);

userSchema.index({ "contact.email": 1 }, { unique: true });
userSchema.index({ "contact.phone": 1 }, { unique: true });
userSchema.index({ "auth.loginId": 1 }, { unique: true });
userSchema.index({ "account.accountNumber": 1 }, { unique: true });
userSchema.index({ "kyc.idType": 1, "kyc.idNumber": 1 }, { unique: true });

export const User = model<UserDocument>("User", userSchema);
