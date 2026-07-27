import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toNotificationSummary } from "../utils/notificationSummary.js";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notification.service.js";

export const getNotifications = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };

  const result = await listNotifications({
    userId: new Types.ObjectId(req.userId),
    page,
    limit,
  });

  res.json({
    success: true,
    data: {
      items: result.items.map(toNotificationSummary),
      total: result.total,
      unreadCount: result.unreadCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const markNotificationReadHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const notification = await markNotificationRead(new Types.ObjectId(req.userId), req.params.id!);
  res.json({ success: true, data: toNotificationSummary(notification) });
});

export const markAllNotificationsReadHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await markAllNotificationsRead(new Types.ObjectId(req.userId));
  res.json({ success: true, data: { message: "All notifications marked as read." } });
});
