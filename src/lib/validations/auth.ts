import { z } from "zod";

const phoneRegex = /^(\+92|0)[0-9]{10}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

export const signupSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(80),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(phoneRegex, "Invalid Pakistani phone number. Use +92 or 0 format."),
  whatsappNumber: z.string().regex(phoneRegex, "Invalid Pakistani WhatsApp number. Use +92 or 0 format."),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string(),
  companyName: z.string().min(2).max(120).optional().or(z.literal("")),
  deliveryArea: z.string().min(2).max(120).optional().or(z.literal("")),
  officeAddress: z.string().min(5).max(500).optional().or(z.literal(""))
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false)
});

export const forgotPasswordSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone number is required")
});

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers")
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
