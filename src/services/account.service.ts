import { Types } from "mongoose";
import { User, type UserDocument } from "../models/user.model.js";
import { deleteProfileImage, uploadProfileImage } from "./cloudinaryUpload.service.js";
import { ApiError } from "../utils/ApiError.js";

export async function updateProfileImage(userId: Types.ObjectId, buffer: Buffer): Promise<UserDocument> {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const previousPublicId = user.profile?.avatarPublicId;

  const { url, publicId } = await uploadProfileImage(buffer);

  user.profile.avatarUrl = url;
  user.profile.avatarPublicId = publicId;
  await user.save();

  if (previousPublicId) {
    await deleteProfileImage(previousPublicId);
  }

  return user;
}

export async function removeProfileImage(userId: Types.ObjectId): Promise<UserDocument> {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const previousPublicId = user.profile?.avatarPublicId;
  if (!previousPublicId) {
    return user;
  }

  user.profile.avatarUrl = undefined;
  user.profile.avatarPublicId = undefined;
  await user.save();

  await deleteProfileImage(previousPublicId);

  return user;
}
