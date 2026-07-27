import { z } from "zod";

const amountToMinorUnits = z
  .number()
  .positive("Enter an amount greater than 0")
  .max(1_000_000, "Amount is too large")
  .refine((v) => Number.isInteger(Math.round(v * 100)), "Amount can have at most 2 decimal places")
  .transform((v) => Math.round(v * 100));

const pinField = z.string().trim().regex(/^[0-9]{4,6}$/, "Enter your PIN");

const objectIdField = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Choose a crypto asset");

export const submitCryptoDepositSchema = z
  .object({
    assetId: objectIdField,
    // Display-only, not minor units — crypto amounts need more than 2 decimal places.
    amountCrypto: z.number().positive("Enter the amount you sent").max(1_000_000, "Amount is too large"),
    amount: amountToMinorUnits,
    txHash: z.string().trim().max(200).optional().or(z.literal("")),
    pin: pinField,
  })
  .strict();

export type SubmitCryptoDepositInput = z.infer<typeof submitCryptoDepositSchema>;

export const rejectCryptoDepositSchema = z
  .object({
    note: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .strict();

export type RejectCryptoDepositInput = z.infer<typeof rejectCryptoDepositSchema>;

export const listCryptoDepositsQuerySchema = z
  .object({
    status: z.enum(["pending", "accepted", "rejected", "crediting", "credited"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type ListCryptoDepositsQuery = z.infer<typeof listCryptoDepositsQuerySchema>;
