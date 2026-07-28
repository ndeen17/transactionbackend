import { z } from "zod";

const amountToMinorUnits = z
  .number()
  .positive("Enter an amount greater than 0")
  .max(1_000_000, "Amount is too large")
  .refine((v) => Number.isInteger(Math.round(v * 100)), "Amount can have at most 2 decimal places")
  .transform((v) => Math.round(v * 100));

const pinField = z.string().trim().regex(/^[0-9]{4,6}$/, "Enter your PIN");

const objectIdField = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Choose a bank account");

export const submitBankDepositSchema = z
  .object({
    bankAccountId: objectIdField,
    amount: amountToMinorUnits,
    senderReference: z.string().trim().max(200).optional().or(z.literal("")),
    pin: pinField,
  })
  .strict();

export type SubmitBankDepositInput = z.infer<typeof submitBankDepositSchema>;

export const rejectBankDepositSchema = z
  .object({
    note: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .strict();

export type RejectBankDepositInput = z.infer<typeof rejectBankDepositSchema>;

export const listBankDepositsQuerySchema = z
  .object({
    status: z.enum(["pending", "rejected", "crediting", "credited"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type ListBankDepositsQuery = z.infer<typeof listBankDepositsQuerySchema>;
