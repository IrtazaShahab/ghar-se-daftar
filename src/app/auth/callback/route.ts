import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change"
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const requestedType = url.searchParams.get("type");
  const requestedNext = url.searchParams.get("next") ?? "/dashboard/customer";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard/customer";

  if (code || (tokenHash && requestedType && EMAIL_OTP_TYPES.has(requestedType as EmailOtpType))) {
    const supabase = await createSupabaseServerClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          token_hash: tokenHash!,
          type: requestedType as EmailOtpType
        });

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  const errorPath = next === "/reset-password"
    ? "/forgot-password?error=invalid_or_expired_link"
    : "/login?error=invalid_or_expired_confirmation";

  return NextResponse.redirect(new URL(errorPath, url.origin));
}
