import type { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { suggestLoginId } from "../services/loginId.service.js";
import { createSignup } from "../services/signup.service.js";
import { issueOtp, verifyOtp } from "../services/otp.service.js";
import { signAuthToken } from "../services/token.service.js";
import {
  loginIdPreviewSchema,
  resendOtpSchema,
  signupSchema,
  verifyOtpSchema,
} from "../validators/signup.schema.js";

export const previewLoginId = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName } = loginIdPreviewSchema.parse(req.body);
  const loginId = await suggestLoginId(firstName, lastName);
  res.json({ success: true, data: { loginId } });
});

export const submitSignup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, "An identification document is required", "MISSING_FILE");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(req.body.data ?? "");
  } catch {
    throw new ApiError(400, "Invalid signup payload", "INVALID_PAYLOAD");
  }

  const parsed = signupSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
  }

  const result = await createSignup(parsed.data, req.file);
  res.status(201).json({ success: true, data: result });
});

export const verifyOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const { userId, code } = verifyOtpSchema.parse(req.body);

  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid or expired code", "INVALID_OR_EXPIRED_CODE");
  }

  await verifyOtp({ userId: new Types.ObjectId(userId), code });

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { status: "active", emailVerifiedAt: new Date() } },
    { new: true },
  );

  if (!user) {
    throw new ApiError(400, "Invalid or expired code", "INVALID_OR_EXPIRED_CODE");
  }

  const token = signAuthToken(user._id.toString(), user.auth.loginId);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id.toString(),
        firstName: user.personal.firstName,
        loginId: user.auth.loginId,
        accountType: user.accountType,
        status: user.status,
        kycReviewStatus: user.kyc.reviewStatus,
      },
    },
  });
});

export const resendOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = resendOtpSchema.parse(req.body);

  const genericResponse = {
    success: true,
    data: {
      message: "If an account is pending verification, a new code has been sent.",
    },
  };

  if (!Types.ObjectId.isValid(userId)) {
    res.json(genericResponse);
    return;
  }

  const user = await User.findById(userId);
  if (!user || user.status !== "pending_verification") {
    res.json(genericResponse);
    return;
  }

  const { otpExpiresInSeconds } = await issueOtp({
    userId: user._id,
    email: user.contact.email,
    firstName: user.personal.firstName,
  });

  res.json({
    success: true,
    data: { message: "A new code has been sent.", otpExpiresInSeconds },
  });
});
