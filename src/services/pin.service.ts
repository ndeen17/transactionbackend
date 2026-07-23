import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function getPinStatus(userId: Types.ObjectId) {
  const user = await User.findById(userId).select("auth.pinSetAt");
  if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");
  return { hasPin: Boolean(user.auth.pinSetAt) };
}

interface SetupPinParams {
  userId: Types.ObjectId;
  pin: string;
  currentPassword: string;
}

export async function setupPin({ userId, pin, currentPassword }: SetupPinParams) {
  const user = await User.findById(userId).select("+auth.passwordHash");
  if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");

  if (user.auth.pinSetAt) {
    throw new ApiError(409, "A transaction PIN is already set.", "PIN_ALREADY_SET");
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.auth.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "Incorrect password", "INVALID_PASSWORD");
  }

  user.auth.pinHash = await bcrypt.hash(pin, env.BCRYPT_SALT_ROUNDS);
  user.auth.pinSetAt = new Date();
  user.auth.pinFailedAttempts = 0;
  user.auth.pinLockedUntil = null;
  await user.save();
}

interface VerifyPinParams {
  userId: Types.ObjectId;
  pin: string;
}

/** Throws on failure (wrong PIN, locked out, no PIN set). Resolves silently on success. */
export async function verifyPin({ userId, pin }: VerifyPinParams) {
  const user = await User.findById(userId).select(
    "+auth.pinHash +auth.pinFailedAttempts +auth.pinLockedUntil",
  );
  if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");

  if (!user.auth.pinHash) {
    throw new ApiError(400, "Set up a transaction PIN first.", "PIN_NOT_SET");
  }

  if (user.auth.pinLockedUntil && user.auth.pinLockedUntil.getTime() > Date.now()) {
    const waitMinutes = Math.ceil((user.auth.pinLockedUntil.getTime() - Date.now()) / 60_000);
    throw new ApiError(
      423,
      `Too many incorrect PIN attempts. Try again in ${waitMinutes} minute(s).`,
      "PIN_LOCKED",
    );
  }

  const matches = await bcrypt.compare(pin, user.auth.pinHash);
  if (!matches) {
    user.auth.pinFailedAttempts += 1;
    if (user.auth.pinFailedAttempts >= env.PIN_MAX_ATTEMPTS) {
      user.auth.pinLockedUntil = new Date(Date.now() + env.PIN_LOCKOUT_MINUTES * 60_000);
    }
    await user.save();
    throw new ApiError(401, "Incorrect PIN", "INVALID_PIN");
  }

  user.auth.pinFailedAttempts = 0;
  user.auth.pinLockedUntil = null;
  await user.save();
}
