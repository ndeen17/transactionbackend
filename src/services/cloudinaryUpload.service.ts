import { Readable } from "node:stream";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary.js";

export interface KycUploadResult {
  publicId: string;
  resourceType: string;
}

/**
 * KYC documents are identity-sensitive, so they're uploaded as `type: "authenticated"`
 * rather than the default public delivery type — the resulting asset isn't reachable by
 * a bare URL, only via a signed URL generated on demand (e.g. by a future admin review
 * endpoint). `resource_type: "auto"` lets Cloudinary route images vs PDFs correctly.
 */
export function uploadKycDocument(buffer: Buffer): Promise<KycUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "kyc",
        resource_type: "auto",
        type: "authenticated",
        unique_filename: true,
        use_filename: false,
        overwrite: false,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ publicId: result.public_id, resourceType: result.resource_type });
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function deleteKycDocument(publicId: string, resourceType: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: "authenticated",
    });
  } catch (err) {
    console.error("[cloudinary] failed to clean up orphaned asset:", err);
  }
}
