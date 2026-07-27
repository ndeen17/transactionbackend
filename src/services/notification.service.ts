import { Types } from "mongoose";
import { Notification, type NotificationDocument } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";

interface CreateNotificationParams {
  userId: Types.ObjectId;
  type: NotificationDocument["type"];
  title: string;
  body: string;
  link?: string;
}

export async function createNotification({ userId, type, title, body, link }: CreateNotificationParams) {
  return Notification.create({ userId, type, title, body, link });
}

interface ListNotificationsParams {
  userId: Types.ObjectId;
  page: number;
  limit: number;
}

export async function listNotifications({ userId, page, limit }: ListNotificationsParams) {
  const skip = (page - 1) * limit;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, read: false }),
  ]);

  return { items, total, unreadCount, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function markNotificationRead(userId: Types.ObjectId, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, "Notification not found", "NOT_FOUND");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { $set: { read: true } },
    { new: true },
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found", "NOT_FOUND");
  }

  return notification;
}

export async function markAllNotificationsRead(userId: Types.ObjectId) {
  await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
}
