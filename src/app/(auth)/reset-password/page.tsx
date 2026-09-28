import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LinkIcon } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRecoveryUser } from "@/lib/auth/recovery";
import { LogoFull } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false }
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ error?: string }>;
}

function InvalidLinkState({ linkFailed }: { linkFailed: boolean }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-danger/10 text-danger">
        <LinkIcon className="size-6" aria-hidden="true" />
      </div>
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          {linkFailed ? "Link expired" : "Reset link required"}
        </h1>
        <p className="mt-3 text-muted">
          {linkFailed
            ? "This password reset link is invalid or has expired. Reset links can only be used once."
            : "To choose a new password, open the reset link from your email. If it has expired, request a new one."}
        </p>
      </div>
      <ButtonLink href="/forgot-password" className="w-full">Request a new reset link</ButtonLink>
      <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:opacity-75">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to login
      </Link>
    </div>
  );
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const recoveryUser = error ? null : await getRecoveryUser(supabase);

  return (
    <div className="auth-surface min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="auth-panel w-full max-w-lg rounded-[28px] p-6 md:p-8">
          <Link href="/" aria-label="Ghar Se Daftar home">
            <LogoFull size="lg" className="mb-8 justify-center" />
          </Link>
          {recoveryUser ? (
            <ResetPasswordForm email={recoveryUser.email ?? null} />
          ) : (
            <InvalidLinkState linkFailed={Boolean(error)} />
          )}
        </div>
      </div>
    </div>
  );
}
