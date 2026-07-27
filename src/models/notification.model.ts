import { Schema, model, type Document, type Types } from "mongoose";

export const NOTIFICATION_TYPES = [
  "crypto_deposit_accepted",
  "crypto_deposit_rejected",
  "crypto_deposit_credited",
] as const;

export interface NotificationDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: (typeof NOTIFICATION_TYPES)[number];
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    link: { type: String, trim: true, maxlength: 200 },
    read: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const Notification = model<NotificationDocument>("Notification", notificationSchema);
