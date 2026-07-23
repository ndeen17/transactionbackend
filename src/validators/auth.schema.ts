import { z } from "zod";

export const loginSchema = z
  .object({
    loginId: z.string().trim().min(1, "Enter your login ID"),
    password: z.string().min(1, "Enter your password"),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
