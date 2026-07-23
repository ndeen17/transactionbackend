import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPinStatus, setupPin } from "../services/pin.service.js";

export const getPinStatusHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const status = await getPinStatus(new Types.ObjectId(req.userId));
  res.json({ success: true, data: status });
});

export const setupPinHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { pin, currentPassword } = req.body as { pin: string; currentPassword: string };
  await setupPin({ userId: new Types.ObjectId(req.userId), pin, currentPassword });
  res.json({ success: true, data: { hasPin: true } });
});
