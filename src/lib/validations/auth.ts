import { z } from "zod";

const emailField = z.string().trim().min(1, "Email is required").email("Enter a valid email address");

const passwordField = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const PASSWORD_HINT = "At least 8 characters with an uppercase letter, a lowercase letter and a number.";

// Office, delivery and WhatsApp details are collected at checkout and in the
// profile, so account creation only asks for what Supabase Auth needs.
export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  email: emailField,
  password: passwordField,
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false)
});

export const forgotPasswordSchema = z.object({
  email: emailField
});

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers")
});

export const resetPasswordSchema = z.object({
  password: passwordField,
  confirmPassword: z.string().min(1, "Please confirm your new password")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
