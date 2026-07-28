import { z } from "zod";

export const createBankAccountSchema = z
  .object({
    bankName: z.string().trim().min(1, "Required").max(80),
    accountName: z.string().trim().min(1, "Required").max(120),
    accountNumber: z.string().trim().min(1, "Required").max(40),
    routingNumber: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .strict();

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;

export const updateBankAccountSchema = createBankAccountSchema;

export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
