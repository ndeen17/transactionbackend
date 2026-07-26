import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { User, type UserDocument } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { issuePasswordResetOtp, verifyPasswordResetOtp } from "./otp.service.js";
import { signAuthToken } from "./token.service.js";

/**
 * Always resolves — never reveals whether a loginId exists. Callers should return the
 * same generic response regardless of the outcome here.
 */
export async function requestPasswordReset(loginId: string): Promise<void> {
  const user = await User.findOne({ "auth.loginId": loginId });
  if (!user) return;
  if (user.status === "suspended" || user.status === "closed") return;

  try {
    await issuePasswordResetOtp({
      userId: user._id,
      email: user.contact.email,
      firstName: user.personal.firstName,
    });
  } catch (err) {
    // A resend-cooldown hit means a code is already in flight — treat as success so the
    // response timing/shape can't be used to tell a real loginId apart from a fake one.
    if (err instanceof ApiError && err.code === "RESEND_COOLDOWN") return;
    throw err;
  }
}

interface ConfirmPasswordResetParams {
  loginId: string;
  code: string;
  newPassword: string;
}

export async function confirmPasswordReset({
  loginId,
  code,
  newPassword,
}: ConfirmPasswordResetParams): Promise<{ token: string; user: UserDocument }> {
  const user = await User.findOne({ "auth.loginId": loginId });
  if (!user) {
    throw new ApiError(400, "Invalid or expired code", "INVALID_OR_EXPIRED_CODE");
  }

  await verifyPasswordResetOtp({ userId: user._id, code });

  user.auth.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  await user.save();

  const token = signAuthToken(user._id.toString(), user.auth.loginId);

  return { token, user };
}
