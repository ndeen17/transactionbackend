import { Router } from "express";
import { deleteAvatar, uploadAvatar } from "../controllers/account.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadAvatarPhoto } from "../middleware/upload.js";
import { avatarUploadLimiter } from "../middleware/rateLimiters.js";

export const accountRouter = Router();

accountRouter.post("/profile-image", requireAuth, avatarUploadLimiter, uploadAvatarPhoto, uploadAvatar);
accountRouter.delete("/profile-image", requireAuth, deleteAvatar);
