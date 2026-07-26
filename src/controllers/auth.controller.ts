import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginSchema } from "../validators/auth.schema.js";
import type { ConfirmPasswordResetInput, RequestPasswordResetInput } from "../validators/passwordReset.schema.js";
import { signAuthToken } from "../services/token.service.js";
import { confirmPasswordReset, requestPasswordReset } from "../services/passwordReset.service.js";
import { toUserSummary } from "../utils/userSummary.js";

// Precomputed once so a login attempt against a non-existent loginId still pays
// the same bcrypt cost as a real one — keeps response timing from leaking
// whether a given loginId exists.
const DUMMY_HASH = bcrypt.hashSync("no-such-account", 10);

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { loginId, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ "auth.loginId": loginId }).select("+auth.passwordHash");

  const matches = await bcrypt.compare(password, user?.auth.passwordHash ?? DUMMY_HASH);

  if (!user || !matches) {
    throw new ApiError(401, "Invalid login ID or password", "INVALID_CREDENTIALS");
  }

  if (user.status === "pending_verification") {
    throw new ApiError(
      403,
      "Please verify your email before logging in.",
      "EMAIL_NOT_VERIFIED",
    );
  }

  if (user.status === "suspended" || user.status === "closed") {
    throw new ApiError(403, "This account is no longer active. Contact support.", "ACCOUNT_INACTIVE");
  }

  const token = signAuthToken(user._id.toString(), user.auth.loginId);

  res.json({
    success: true,
    data: { token, user: toUserSummary(user) },
  });
});

export const requestPasswordResetHandler = asyncHandler(async (req: Request, res: Response) => {
  const { loginId } = req.body as RequestPasswordResetInput;
  await requestPasswordReset(loginId);

  res.json({
    success: true,
    data: { message: "If an account exists for that login ID, we've sent a reset code to the email on file." },
  });
});

export const confirmPasswordResetHandler = asyncHandler(async (req: Request, res: Response) => {
  const { loginId, code, newPassword } = req.body as ConfirmPasswordResetInput;
  const { token, user } = await confirmPasswordReset({ loginId, code, newPassword });

  res.json({
    success: true,
    data: { token, user: toUserSummary(user) },
  });
});

export const getMe = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  res.json({
    success: true,
    data: toUserSummary(user),
  });
});
