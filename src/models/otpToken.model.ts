import { Schema, model, Types } from "mongoose";

export const OTP_PURPOSES = ["email_verification", "password_reset", "login_2fa"] as const;

const otpTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  purpose: { type: String, enum: OTP_PURPOSES, default: "email_verification" },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  sendCount: { type: Number, default: 1 },
  lastSentAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

otpTokenSchema.index({ userId: 1, purpose: 1 }, { unique: true });
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export interface OtpTokenDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  purpose: (typeof OTP_PURPOSES)[number];
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  sendCount: number;
  lastSentAt: Date;
  createdAt: Date;
}

export const OtpToken = model("OtpToken", otpTokenSchema);
