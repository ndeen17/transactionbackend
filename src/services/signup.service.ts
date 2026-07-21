import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import type { SignupInput } from "../validators/signup.schema.js";
import { generateUniqueLoginId, buildBaseLoginId } from "./loginId.service.js";
import { issueOtp } from "./otp.service.js";
import { deleteKycDocument, uploadKycDocument } from "./cloudinaryUpload.service.js";
import { ApiError } from "../utils/ApiError.js";

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export async function createSignup(input: SignupInput, file: UploadedFile) {
  const passwordHash = await bcrypt.hash(input.auth.password, env.BCRYPT_SALT_ROUNDS);
  const base = buildBaseLoginId(input.personal.firstName, input.personal.lastName);
  const loginId = await generateUniqueLoginId(base);

  const { publicId, resourceType } = await uploadKycDocument(file.buffer);

  let user;
  try {
    user = await User.create({
      accountType: input.accountType,
      personal: input.personal,
      contact: input.contact,
      kyc: {
        idType: input.kyc.idType,
        idNumber: input.kyc.idNumber,
        idDocumentPublicId: publicId,
        idDocumentResourceType: resourceType,
        idDocumentOriginalName: file.originalname,
        idDocumentMimeType: file.mimetype,
      },
      employment: input.employment,
      auth: { loginId, passwordHash },
      consents: { ...input.consents, consentedAt: new Date() },
    });
  } catch (err) {
    await deleteKycDocument(publicId, resourceType);
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, duplicateKeyMessage(err), duplicateKeyCode(err));
    }
    throw err;
  }

  const { otpExpiresInSeconds } = await issueOtp({
    userId: user._id,
    email: user.contact.email,
    firstName: user.personal.firstName,
  }).catch((err) => {
    console.error("[signup] failed to send verification email:", err);
    return { otpExpiresInSeconds: env.OTP_EXPIRY_MINUTES * 60 };
  });

  return {
    userId: user._id.toString(),
    loginId: user.auth.loginId,
    status: user.status,
    otpExpiresInSeconds,
  };
}

function isDuplicateKeyError(err: unknown): err is { keyPattern?: Record<string, unknown> } {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: unknown }).code === 11000);
}

function duplicateKeyMessage(err: { keyPattern?: Record<string, unknown> }): string {
  const key = Object.keys(err.keyPattern ?? {})[0] ?? "";
  if (key.includes("email")) return "This email is already registered.";
  if (key.includes("phone")) return "This phone number is already registered.";
  if (key.includes("loginId")) return "That login ID is taken. Please try again.";
  if (key.includes("idNumber")) return "This identification document is already registered.";
  return "A record with these details already exists.";
}

function duplicateKeyCode(err: { keyPattern?: Record<string, unknown> }): string {
  const key = Object.keys(err.keyPattern ?? {})[0] ?? "";
  if (key.includes("email")) return "EMAIL_ALREADY_REGISTERED";
  if (key.includes("phone")) return "PHONE_ALREADY_REGISTERED";
  if (key.includes("loginId")) return "LOGIN_ID_TAKEN";
  if (key.includes("idNumber")) return "ID_DOCUMENT_ALREADY_REGISTERED";
  return "DUPLICATE_KEY";
}
