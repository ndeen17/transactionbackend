import { z } from "zod";

const pinField = z.string().trim().regex(/^[0-9]{4,6}$/, "Enter your PIN");
const objectIdField = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Choose a valid crypto asset");

export const submitCryptoWithdrawalSchema = z
  .object({
    assetId: objectIdField,
    amountCrypto: z.number().positive("Enter the amount to withdraw").max(1_000_000, "Amount is too large"),
    walletAddress: z.string().trim().min(1, "Required").max(200),
    network: z.string().trim().max(40).optional().or(z.literal("")),
    pin: pinField,
  })
  .strict();

export type SubmitCryptoWithdrawalInput = z.infer<typeof submitCryptoWithdrawalSchema>;
