import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof MulterError) {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof Error && err.message === "UNSUPPORTED_FILE_TYPE") {
    res.status(415).json({
      success: false,
      message: "Unsupported file type. Upload a JPG, PNG, WEBP, or PDF.",
      code: "UNSUPPORTED_FILE_TYPE",
    });
    return;
  }

  if (err && typeof err === "object" && "code" in err && (err as { code: unknown }).code === 11000) {
    res.status(409).json({
      success: false,
      message: "A record with these details already exists.",
      code: "DUPLICATE_KEY",
    });
    return;
  }

  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong" });
}
