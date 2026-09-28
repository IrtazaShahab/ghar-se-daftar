import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeRedirectPath } from "@/lib/app-url";
import { RECOVERY_COOKIE, RESET_PASSWORD_PATH, recoveryCookieOptions } from "@/lib/auth/recovery";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change"
]);

const DEFAULT_NEXT = "/dashboard/customer";

/**
 * Verifies Supabase email links server-side and stores the session in cookies.
 * Recovery emails use `token_hash` + verifyOtp (works on any device). The PKCE
 * `code` branch only serves Supabase's default templates, which need the
 * verifier cookie from the browser that made the request.
 */
async function verifyEmailLink(code: string | null, tokenHash: string | null, type: EmailOtpType | null) {
  const supabase = await createSupabaseServerClient();

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    return error ? null : data.user;
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? null : data.user;
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const requestedType = url.searchParams.get("type");
  const type = requestedType && EMAIL_OTP_TYPES.has(requestedType as EmailOtpType)
    ? (requestedType as EmailOtpType)
    : null;
  const next = sanitizeRedirectPath(url.searchParams.get("next"), DEFAULT_NEXT);
  const isRecovery = type === "recovery" || (!tokenHash && next === RESET_PASSWORD_PATH);

  const user = await verifyEmailLink(code, tokenHash, type);

  if (isRecovery) {
    const destination = new URL(RESET_PASSWORD_PATH, url.origin);
    if (!user) destination.searchParams.set("error", "invalid_link");

    // Redirecting also removes the one-time token from the address bar.
    const response = NextResponse.redirect(destination);
    response.cookies.set(RECOVERY_COOKIE, user?.id ?? "", {
      ...recoveryCookieOptions,
      maxAge: user ? recoveryCookieOptions.maxAge : 0
    });
    return response;
  }

  if (user) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=invalid_or_expired_confirmation", url.origin));
}
