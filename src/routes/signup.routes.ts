import { Router } from "express";
import {
  previewLoginId,
  resendOtpHandler,
  submitSignup,
  verifyOtpHandler,
} from "../controllers/signup.controller.js";
import { uploadKycDocument } from "../middleware/upload.js";
import {
  loginIdPreviewLimiter,
  otpResendLimiter,
  otpVerifyLimiter,
  signupLimiter,
} from "../middleware/rateLimiters.js";

export const signupRouter = Router();

signupRouter.post("/login-id/preview", loginIdPreviewLimiter, previewLoginId);
signupRouter.post("/", signupLimiter, uploadKycDocument, submitSignup);
signupRouter.post("/otp/verify", otpVerifyLimiter, verifyOtpHandler);
signupRouter.post("/otp/resend", otpResendLimiter, resendOtpHandler);
