import { z } from "zod";
import { ACCOUNT_TYPES, GENDERS, ID_TYPES, MARITAL_STATUSES } from "../models/user.model.js";

const nameField = z.string().trim().min(1).max(60);

/** Optional selects submit "" when untouched — treat that the same as absent. */
function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z
    .union([z.enum(values), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v));
}

function isAtLeast18(dob: string) {
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 18;
}

export const personalSchema = z.object({
  firstName: nameField,
  middleName: nameField.optional().or(z.literal("")),
  lastName: nameField,
  dateOfBirth: z
    .string()
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Enter a valid date")
    .refine(isAtLeast18, "You must be at least 18 years old"),
  gender: z.enum(GENDERS),
  nationality: z.string().trim().length(2, "Use a 2-letter country code"),
  maritalStatus: optionalEnum(MARITAL_STATUSES),
});

export const contactSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, "Enter a valid phone number"),
  address: z.object({
    line1: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(80),
    state: z.string().trim().min(1).max(80),
    postalCode: z.string().trim().min(1).max(20),
    country: z.string().trim().length(2, "Use a 2-letter country code"),
  }),
});

export const kycSchema = z.object({
  idType: z.enum(ID_TYPES),
  idNumber: z.string().trim().min(3).max(40),
});

const passwordField = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const authSchema = z
  .object({
    loginId: z.string().trim().min(3).max(40),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const consentsSchema = z.object({
  termsAccepted: z.literal(true),
  privacyPolicyAccepted: z.literal(true),
  electronicCommsConsent: z.literal(true),
  dataProcessingConsent: z.literal(true),
  amlDeclaration: z.literal(true),
});

export const signupSchema = z
  .object({
    accountType: z.enum(ACCOUNT_TYPES),
    personal: personalSchema,
    contact: contactSchema,
    kyc: kycSchema,
    auth: authSchema,
    consents: consentsSchema,
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;

export const loginIdPreviewSchema = z
  .object({
    firstName: nameField,
    lastName: nameField,
  })
  .strict();

export const verifyOtpSchema = z
  .object({
    userId: z.string().min(1),
    code: z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
  })
  .strict();

export const resendOtpSchema = z
  .object({
    userId: z.string().min(1),
  })
  .strict();
