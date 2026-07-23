import { z } from "zod";

export const setupPinSchema = z
  .object({
    pin: z.string().trim().regex(/^[0-9]{4,6}$/, "PIN must be 4 to 6 digits"),
    confirmPin: z.string(),
    currentPassword: z.string().min(1, "Enter your password"),
  })
  .strict()
  .refine((v) => v.pin === v.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export type SetupPinInput = z.infer<typeof setupPinSchema>;
