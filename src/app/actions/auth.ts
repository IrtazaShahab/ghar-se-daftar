"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser as getAuthenticatedUser } from "@/lib/auth/get-user";
import { createSupabaseServerClient, SupabaseConfigError } from "@/lib/supabase/server";
import { AppUrlConfigError, getAuthCallbackUrl } from "@/lib/app-url";
import { clearRecoveryCookie, getRecoveryUser, RESET_PASSWORD_PATH } from "@/lib/auth/recovery";
import { isAuthError, isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type SignupInput
} from "@/lib/validations/auth";

const RESET_REQUEST_COOLDOWN_SECONDS = 60;
const RESET_REQUEST_ACCEPTED =
  "We've received your request. If an account exists for this email, you'll receive reset instructions shortly.";
const INVALID_RESET_LINK = "This password reset link is invalid or has expired.";

export type ForgotPasswordResult =
  | { success: true; message: string; cooldownSeconds: number }
  | {
      success: false;
      reason: "invalid_email" | "rate_limited" | "network" | "unavailable";
      error: string;
      retryAfterSeconds?: number;
    };

/** On success the action redirects to /login?reset=success instead of returning. */
export type ResetPasswordResult =
  | { success: true }
  | { success: false; reason: "invalid" | "session_expired" | "failed"; error: string };

const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
const EMAIL_PATTERN = /[^\s"'<>@]+@[^\s"'<>@]+/g;

/**
 * Logs only non-sensitive diagnostics: never passwords or tokens. Email
 * addresses that Supabase echoes in messages are redacted. Logged as one
 * string because the Next.js dev log drops plain-object fields.
 */
function logAuthError(context: string, error: unknown) {
  if (!(error instanceof Error)) {
    console.error(`${context}: unknown error`);
    return;
  }

  const details = [
    `name=${error.name}`,
    isAuthError(error) && `code=${error.code ?? "none"}`,
    isAuthError(error) && `status=${error.status ?? "none"}`,
    `message=${error.message.replace(EMAIL_PATTERN, "[email]")}`
  ].filter(Boolean);

  console.error(`${context}: ${details.join(" ")}`);
}

function getAuthErrorMessage(error?: AuthError | null) {
  const normalized = error?.message.toLowerCase() ?? "";

  if (error?.code === "invalid_credentials" || normalized.includes("invalid login credentials")) {
    return "Invalid email or password";
  }

  if (error?.code === "email_not_confirmed" || normalized.includes("email not confirmed")) {
    return "Please confirm your email before logging in.";
  }

  if (error?.code === "user_already_exists" || normalized.includes("already registered")) {
    return "Email already registered";
  }

  if (error?.status === 429) {
    return "Too many attempts. Please wait a little before trying again.";
  }

  if (error?.code === "weak_password") {
    return "That password is too weak. Please choose a stronger one.";
  }

  return "Authentication failed. Please try again.";
}

async function writeAuditLog(actorId: string, action: string, entityId = actorId) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity: "User",
        entityId
      }
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

/**
 * Sign up a new user in Supabase Auth and create the app profile in Prisma.
 * Office and contact details are optional profile data collected later.
 */
export async function signup(input: SignupInput) {
  try {
    const validatedData = signupSchema.parse(input);
    const email = validatedData.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existingUser) {
      return {
        success: false,
        error: "Email already registered"
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: validatedData.password,
      options: {
        emailRedirectTo: await getAuthCallbackUrl("/"),
        data: {
          full_name: validatedData.fullName
        }
      }
    });

    if (error || !data.user) {
      if (error) logAuthError("Signup error", error);
      return {
        success: false,
        error: getAuthErrorMessage(error)
      };
    }

    await prisma.user.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        email,
        fullName: validatedData.fullName,
        role: "CUSTOMER",
        status: "ACTIVE",
        emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
        profile: { create: {} }
      },
      update: {
        email,
        fullName: validatedData.fullName
      }
    });

    await writeAuditLog(data.user.id, "USER_SIGNUP");

    return {
      success: true,
      userId: data.user.id,
      requiresEmailConfirmation: !data.session,
      message: data.session ? "Account created successfully" : "Account created. Please confirm your email before logging in."
    };
  } catch (error) {
    logAuthError("Signup error", error);
    return {
      success: false,
      error: "Failed to create account. Please try again."
    };
  }
}

/**
 * Log in with Supabase email/password authentication.
 */
export async function login(input: LoginInput) {
  try {
    const validatedData = loginSchema.parse(input);
    const email = validatedData.email.toLowerCase();

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: validatedData.password
    });

    if (error || !data.user) {
      if (error && error.code !== "invalid_credentials") logAuthError("Login error", error);
      return {
        success: false,
        error: getAuthErrorMessage(error)
      };
    }

    let user = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { id: true, role: true, status: true }
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, status: true }
      });
    }

    if (!user) {
      const fullName =
        typeof data.user.user_metadata.full_name === "string" && data.user.user_metadata.full_name.trim()
          ? data.user.user_metadata.full_name
          : email.split("@")[0];

      user = await prisma.user.create({
        data: {
          id: data.user.id,
          email,
          fullName,
          role: "CUSTOMER",
          status: "ACTIVE",
          profile: { create: {} }
        },
        select: { id: true, role: true, status: true }
      });
    }

    if (user.status !== "ACTIVE") {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Your account is not active. Please contact support."
      };
    }

    await writeAuditLog(user.id, "USER_LOGIN");

    return {
      success: true,
      userId: user.id,
      role: user.role,
      message: "Logged in successfully"
    };
  } catch (error) {
    logAuthError("Login error", error);
    return {
      success: false,
      error: "Failed to log in. Please try again."
    };
  }
}

/**
 * Log out the current Supabase Auth session.
 */
export async function logout() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: "Failed to log out"
      };
    }

    return {
      success: true,
      message: "Logged out successfully"
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "Failed to log out"
    };
  }
}

/**
 * Maps a Supabase /recover failure to a user-facing result. Supabase's
 * per-address cooldown ("you can only request this after N seconds") only
 * occurs when an email was sent moments ago, so it is reported as accepted to
 * avoid revealing which addresses are registered.
 */
function toForgotPasswordFailure(error: AuthError): ForgotPasswordResult {
  const cooldown = error.message.match(/after (\d+) seconds?/i);

  if (error.code === "over_request_rate_limit" && cooldown) {
    return { success: true, message: RESET_REQUEST_ACCEPTED, cooldownSeconds: Number(cooldown[1]) };
  }

  if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return {
      success: false,
      reason: "rate_limited",
      error: "Too many reset requests. Please wait a little before trying again.",
      retryAfterSeconds: RESET_REQUEST_COOLDOWN_SECONDS
    };
  }

  if (error.code === "email_address_invalid" || error.code === "validation_failed") {
    return { success: false, reason: "invalid_email", error: "Please enter a valid email address." };
  }

  if (isAuthRetryableFetchError(error)) {
    return {
      success: false,
      reason: "network",
      error: "We couldn't reach our servers. Check your connection and try again."
    };
  }

  const devDetail = IS_DEVELOPMENT ? ` (Supabase: ${error.code ?? error.name}, status ${error.status ?? "unknown"})` : "";
  return {
    success: false,
    reason: "unavailable",
    error: `We couldn't send reset instructions right now. Please try again later or contact support.${devDetail}`
  };
}

/**
 * Send a Supabase password recovery email. Success is reported identically
 * whether or not the address is registered, to prevent account enumeration.
 */
export async function forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, reason: "invalid_email", error: "Please enter a valid email address." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const redirectTo = await getAuthCallbackUrl(RESET_PASSWORD_PATH);
    // TEMPORARY diagnostic: the callback URL we ask Supabase to use. It contains no
    // token or email (Supabase adds the token itself). If the email shows a
    // different origin than this, Supabase rejected it as not allow-listed and
    // fell back to the Site URL. Remove once local resets are confirmed.
    console.info(`[auth] password reset redirectTo=${redirectTo}`);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email.toLowerCase(), {
      redirectTo
    });

    if (error) {
      logAuthError("Password recovery error", error);
      return toForgotPasswordFailure(error);
    }

    return { success: true, message: RESET_REQUEST_ACCEPTED, cooldownSeconds: RESET_REQUEST_COOLDOWN_SECONDS };
  } catch (error) {
    const isConfigError = error instanceof AppUrlConfigError || error instanceof SupabaseConfigError;
    logAuthError(isConfigError ? "Password recovery configuration error" : "Password recovery error", error);
    return {
      success: false,
      reason: "unavailable",
      // Configuration messages name env variables only, so they are safe to show while developing.
      error: IS_DEVELOPMENT && isConfigError
        ? `Password reset is misconfigured: ${(error as Error).message}`
        : "Password reset is temporarily unavailable. Please try again later or contact support."
    };
  }
}

/**
 * Set a new password. Only works inside a verified recovery session created
 * by /auth/callback; the session is ended afterwards so the user signs in
 * again with the new password.
 */
export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, reason: "invalid", error: parsed.error.issues[0]?.message ?? "Check your new password." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const recoveryUser = await getRecoveryUser(supabase);

    if (!recoveryUser) {
      return { success: false, reason: "session_expired", error: INVALID_RESET_LINK };
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      logAuthError("Reset password error", error);

      if (error.code === "same_password") {
        return { success: false, reason: "invalid", error: "Choose a password different from your current one." };
      }
      if (error.code === "weak_password") {
        return { success: false, reason: "invalid", error: "That password is too weak. Please choose a stronger one." };
      }
      if (error.status === 401 || error.code === "session_not_found" || error.code === "reauthentication_needed") {
        return { success: false, reason: "session_expired", error: INVALID_RESET_LINK };
      }
      return { success: false, reason: "failed", error: "We couldn't update your password. Please try again." };
    }

    await writeAuditLog(recoveryUser.id, "USER_PASSWORD_RESET");
    // End the recovery session only after the password change succeeded.
    await supabase.auth.signOut();
    await clearRecoveryCookie();
  } catch (error) {
    logAuthError("Reset password error", error);
    return { success: false, reason: "failed", error: "We couldn't update your password. Please try again." };
  }

  // Changing cookies in a Server Action re-renders /reset-password, which (with
  // the recovery session gone) would show "Reset link required" over the
  // success message. Send the user straight to login instead. redirect() throws,
  // so it must stay outside the try/catch above.
  redirect("/login?reset=success");
}

/**
 * Session summary for client components (e.g. the site nav). Returns only
 * display fields, never the full user row.
 */
export async function getCurrentUser() {
  try {
    const user = await getAuthenticatedUser();
    return user ? { id: user.id, fullName: user.fullName, role: user.role } : null;
  } catch {
    // Nav only: during a database outage show the signed-out nav rather than failing.
    return null;
  }
}
