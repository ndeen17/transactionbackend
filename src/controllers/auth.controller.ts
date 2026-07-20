import type { Response } from "express";
import { User } from "../models/user.model.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMe = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  res.json({
    success: true,
    data: {
      id: user._id.toString(),
      firstName: user.personal.firstName,
      lastName: user.personal.lastName,
      loginId: user.auth.loginId,
      accountType: user.accountType,
      status: user.status,
      kycReviewStatus: user.kyc.reviewStatus,
    },
  });
});
