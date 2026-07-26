import { z } from "zod";
import { KYC_REVIEW_STATUSES, USER_STATUSES } from "../models/user.model.js";

export const adminLoginSchema = z
  .object({
    password: z.string().min(1, "Enter the admin password"),
  })
  .strict();

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const listAdminUsersQuerySchema = z
  .object({
    status: z.enum(USER_STATUSES).optional(),
    kycStatus: z.enum(KYC_REVIEW_STATUSES).optional(),
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;

export const balanceAdjustmentSchema = z
  .object({
    direction: z.enum(["credit", "debit"]),
    amount: z
      .number()
      .positive("Enter an amount greater than 0")
      .max(1_000_000, "Amount is too large")
      .refine((v) => Number.isInteger(Math.round(v * 100)), "Amount can have at most 2 decimal places")
      .transform((v) => Math.round(v * 100)),
    note: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .strict();

export type BalanceAdjustmentInput = z.infer<typeof balanceAdjustmentSchema>;
