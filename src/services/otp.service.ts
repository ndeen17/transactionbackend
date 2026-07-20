import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { OtpToken } from "../models/otpToken.model.js";
import { ApiError } from "../utils/ApiError.js";
import { sendOtpEmail } from "./email.service.js";

function generateCode(): string {
  return String(randomInt(100000, 999999));
}

interface IssueOtpParams {
  userId: Types.ObjectId;
  email: string;
  firstName: string;
}

export async function issueOtp({ userId, email, firstName }: IssueOtpParams) {
  const existing = await OtpToken.findOne({ userId, purpose: "email_verification" });

  if (existing) {
    const cooldownEndsAt =
      existing.lastSentAt.getTime() + env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (Date.now() < cooldownEndsAt) {
      const waitSeconds = Math.ceil((cooldownEndsAt - Date.now()) / 1000);
      throw new ApiError(429, `Please wait ${waitSeconds}s before requesting another code.`, "RESEND_COOLDOWN");
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await OtpToken.findOneAndUpdate(
    { userId, purpose: "email_verification" },
    {
      $set: { codeHash, expiresAt, attempts: 0, lastSentAt: new Date() },
      $inc: { sendCount: 1 },
      $setOnInsert: { userId, purpose: "email_verification" },
    },
    { upsert: true, new: true },
  );

  if (env.DEBUG_LOG_OTP) {
    console.log(`[otp] verification code for ${email}: ${code}`);
  }

  await sendOtpEmail({ to: email, firstName, code });

  return { otpExpiresInSeconds: env.OTP_EXPIRY_MINUTES * 60 };
}

interface VerifyOtpParams {
  userId: Types.ObjectId;
  code: string;
}

export async function verifyOtp({ userId, code }: VerifyOtpParams) {
  const token = await OtpToken.findOne({ userId, purpose: "email_verification" });

  if (!token || token.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "Invalid or expired code", "INVALID_OR_EXPIRED_CODE");
  }

  if (token.attempts >= env.OTP_MAX_ATTEMPTS) {
    await token.deleteOne();
    throw new ApiError(429, "Too many incorrect attempts. Please request a new code.", "TOO_MANY_ATTEMPTS");
  }

  const matches = await bcrypt.compare(code, token.codeHash);
  if (!matches) {
    token.attempts += 1;
    await token.save();
    throw new ApiError(400, "Invalid or expired code", "INVALID_OR_EXPIRED_CODE");
  }

  await token.deleteOne();
}
