import { z } from "zod";

const amountToMinorUnits = z
  .number()
  .positive("Enter an amount greater than 0")
  .max(1_000_000, "Amount is too large")
  .refine((v) => Number.isInteger(Math.round(v * 100)), "Amount can have at most 2 decimal places")
  .transform((v) => Math.round(v * 100));

const pinField = z.string().trim().regex(/^[0-9]{4,6}$/, "Enter your PIN");

export const submitBankWithdrawalSchema = z
  .object({
    amount: amountToMinorUnits,
    bankName: z.string().trim().min(1, "Required").max(80),
    accountName: z.string().trim().min(1, "Required").max(120),
    accountNumber: z.string().trim().min(1, "Required").max(40),
    routingNumber: z.string().trim().max(40).optional().or(z.literal("")),
    pin: pinField,
  })
  .strict();

export type SubmitBankWithdrawalInput = z.infer<typeof submitBankWithdrawalSchema>;
