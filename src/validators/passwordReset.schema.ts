import { z } from "zod";

export const requestPasswordResetSchema = z
  .object({
    loginId: z.string().trim().min(1, "Enter your login ID"),
  })
  .strict();

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

const newPasswordField = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const confirmPasswordResetSchema = z
  .object({
    loginId: z.string().trim().min(1, "Enter your login ID"),
    code: z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
    newPassword: newPasswordField,
    confirmNewPassword: z.string(),
  })
  .strict()
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;
