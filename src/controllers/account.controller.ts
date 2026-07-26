import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { toUserSummary } from "../utils/userSummary.js";
import { removeProfileImage, updateProfileImage } from "../services/account.service.js";

export const uploadAvatar = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, "Choose a photo to upload", "MISSING_FILE");
  }

  const user = await updateProfileImage(new Types.ObjectId(req.userId), req.file.buffer);
  res.json({ success: true, data: toUserSummary(user) });
});

export const deleteAvatar = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await removeProfileImage(new Types.ObjectId(req.userId));
  res.json({ success: true, data: toUserSummary(user) });
});
