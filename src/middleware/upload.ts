import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import { env } from "../config/env.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

// Some mobile camera-roll pickers report an empty/generic MIME type for HEIC/HEIF —
// fall back to the file extension rather than reject a legitimate upload outright.
const ALLOWED_EXTENSIONS_RE = /\.(jpe?g|png|webp|heic|heif|pdf)$/i;

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  const allowed = ALLOWED_MIME_TYPES.has(file.mimetype) || ALLOWED_EXTENSIONS_RE.test(file.originalname);
  if (!allowed) {
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
