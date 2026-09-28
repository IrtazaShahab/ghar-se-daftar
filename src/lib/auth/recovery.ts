import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export const RESET_PASSWORD_PATH = "/reset-password";

/**
 * httpOnly marker set by /auth/callback only after Supabase verifies a
 * recovery link. It binds the password form to the recovery session, so an
 * ordinary logged-in session (or none) cannot reach the update step.
 */
export const RECOVERY_COOKIE = "gsd-password-recovery";
export const RECOVERY_WINDOW_SECONDS = 15 * 60;

export const recoveryCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: RESET_PASSWORD_PATH,
  maxAge: RECOVERY_WINDOW_SECONDS
};

/**
 * Returns the Supabase user when a verified recovery session exists, else null.
 * getUser() validates the access token with Supabase rather than trusting cookies.
 */
export async function getRecoveryUser(supabase: SupabaseClient) {
  const recoveryUserId = (await cookies()).get(RECOVERY_COOKIE)?.value;
  if (!recoveryUserId) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== recoveryUserId) return null;

  return data.user;
}

export async function clearRecoveryCookie() {
  (await cookies()).set(RECOVERY_COOKIE, "", { ...recoveryCookieOptions, maxAge: 0 });
}
