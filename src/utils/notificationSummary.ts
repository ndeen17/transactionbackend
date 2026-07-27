import type { NotificationDocument } from "../models/notification.model.js";

export function toNotificationSummary(notification: NotificationDocument) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    read: notification.read,
    createdAt: notification.createdAt,
  };
}

export type NotificationSummary = ReturnType<typeof toNotificationSummary>;
