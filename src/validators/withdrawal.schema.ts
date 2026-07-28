import { z } from "zod";

// Shared between crypto and bank withdrawals — both admin review actions and list
// filters have the exact same shape regardless of withdrawal method.
export const declineWithdrawalSchema = z
  .object({
    note: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .strict();

export type DeclineWithdrawalInput = z.infer<typeof declineWithdrawalSchema>;

export const listWithdrawalsQuerySchema = z
  .object({
    status: z.enum(["processing", "completed", "declined", "reversing"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type ListWithdrawalsQuery = z.infer<typeof listWithdrawalsQuerySchema>;
