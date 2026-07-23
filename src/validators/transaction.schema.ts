import { z } from "zod";

// Accepts a decimal dollar amount from the client, rejects anything not exactly
// representable in whole cents, and converts to integer minor units for storage.
const amountToMinorUnits = z
  .number()
  .positive("Enter an amount greater than 0")
  .max(1_000_000, "Amount is too large")
  .refine((v) => Number.isInteger(Math.round(v * 100)), "Amount can have at most 2 decimal places")
  .transform((v) => Math.round(v * 100));

const pinField = z.string().trim().regex(/^[0-9]{4,6}$/, "Enter your PIN");

export const transferSchema = z
  .object({
    recipientName: z.string().trim().min(1, "Required").max(120),
    bankName: z.string().trim().min(1, "Required").max(120),
    recipientAccountNumber: z.string().trim().min(1, "Required").max(40),
    amount: amountToMinorUnits,
    narration: z.string().trim().max(200).optional().or(z.literal("")),
    pin: pinField,
  })
  .strict();

export type TransferInput = z.infer<typeof transferSchema>;

export const depositSchema = z
  .object({
    amount: amountToMinorUnits,
    pin: pinField,
  })
  .strict();

export type DepositInput = z.infer<typeof depositSchema>;

export const listTransactionsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
