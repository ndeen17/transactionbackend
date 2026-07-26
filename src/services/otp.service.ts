import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { OtpToken } from "../models/otpToken.model.js";
import { ApiError } from "../utils/ApiError.js";
import { sendOtpEmail, sendPasswordResetEmail } from "./email.service.js";

type OtpPurpose = "email_verification" | "password_reset";

function generateCode(): string {
  return String(randomInt(100000, 999999));
}

async function createOtpCode(
  userId: Types.ObjectId,
  purpose: OtpPurpose,
): Promise<{ code: string; expiresInSeconds: number }> {
  const existing = await OtpToken.findOne({ userId, purpose });

  if (existing) {
    const cooldownEndsAt = existing.lastSentAt.getTime() + env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (Date.now() < cooldownEndsAt) {
      const waitSeconds = Math.ceil((cooldownEndsAt - Date.now()) / 1000);
      throw new ApiError(429, `Please wait ${waitSeconds}s before requesting another code.`, "RESEND_COOLDOWN");
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await OtpToken.findOneAndUpdate(
    { userId, purpose },
    {
      $set: { codeHash, expiresAt, attempts: 0, lastSentAt: new Date() },
      $inc: { sendCount: 1 },
      $setOnInsert: { userId, purpose },
    },
    { upsert: true, new: true },
  );

  return { code, expiresInSeconds: env.OTP_EXPIRY_MINUTES * 60 };
}

async function consumeOtpCode(userId: Types.ObjectId, purpose: OtpPurpose, code: string): Promise<void> {
  const token = await OtpToken.findOne({ userId, purpose });

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

// ---- Email verification (signup) ----

interface IssueOtpParams {
  userId: Types.ObjectId;
  email: string;
  firstName: string;
}

export async function issueOtp({ userId, email, firstName }: IssueOtpParams) {
  const { code, expiresInSeconds } = await createOtpCode(userId, "email_verification");

  if (env.DEBUG_LOG_OTP) {
    console.log(`[otp] verification code for ${email}: ${code}`);
  }

  await sendOtpEmail({ to: email, firstName, code });

  return { otpExpiresInSeconds: expiresInSeconds };
}

interface VerifyOtpParams {
  userId: Types.ObjectId;
  code: string;
}

export async function verifyOtp({ userId, code }: VerifyOtpParams) {
  await consumeOtpCode(userId, "email_verification", code);
}

// ---- Password reset ----

interface IssuePasswordResetOtpParams {
  userId: Types.ObjectId;
  email: string;
  firstName: string;
}

export async function issuePasswordResetOtp({ userId, email, firstName }: IssuePasswordResetOtpParams) {
  const { code, expiresInSeconds } = await createOtpCode(userId, "password_reset");

  if (env.DEBUG_LOG_OTP) {
    console.log(`[otp] password reset code for ${email}: ${code}`);
  }

  await sendPasswordResetEmail({ to: email, firstName, code });

  return { otpExpiresInSeconds: expiresInSeconds };
}

interface VerifyPasswordResetOtpParams {
  userId: Types.ObjectId;
  code: string;
}

export async function verifyPasswordResetOtp({ userId, code }: VerifyPasswordResetOtpParams) {
  await consumeOtpCode(userId, "password_reset", code);
}
