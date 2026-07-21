import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import { env } from "../config/env.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error("UNSUPPORTED_FILE_TYPE"));
    return;
  }
  cb(null, true);
}

export const uploadKycDocument = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: env.KYC_MAX_FILE_SIZE_MB * 1024 * 1024 },
}).single("idDocument");
