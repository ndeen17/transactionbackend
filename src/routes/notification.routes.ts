import { Router } from "express";
import {
  getNotifications,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateQuery } from "../middleware/validate.js";
import { listNotificationsQuerySchema } from "../validators/notification.schema.js";

export const notificationRouter = Router();

notificationRouter.get("/", requireAuth, validateQuery(listNotificationsQuerySchema), getNotifications);
notificationRouter.post("/:id/read", requireAuth, markNotificationReadHandler);
notificationRouter.post("/read-all", requireAuth, markAllNotificationsReadHandler);
