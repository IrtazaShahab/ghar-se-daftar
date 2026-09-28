"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPassword, type ForgotPasswordResult } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import Link from "next/link";
import { Mail, ArrowLeft, LifeBuoy, CheckCircle2, Clock3 } from "lucide-react";

type Status =
  | { kind: "idle" }
  | { kind: "sent"; message: string }
  | { kind: "error"; reason: Extract<ForgotPasswordResult, { success: false }>["reason"]; message: string };

function useCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  return [secondsLeft, setSecondsLeft] as const;
}

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [cooldown, setCooldown] = useCooldown();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    if (cooldown > 0) return;

    try {
      const result = await forgotPassword(data);
      if (result.success) {
        setStatus({ kind: "sent", message: result.message });
        setCooldown(result.cooldownSeconds);
      } else {
        setStatus({ kind: "error", reason: result.reason, message: result.error });
        if (result.retryAfterSeconds) setCooldown(result.retryAfterSeconds);
      }
    } catch {
      setStatus({
        kind: "error",
        reason: "network",
        message: "We couldn't reach our servers. Check your connection and try again."
      });
    }
  };

  const isDisabled = isSubmitting || cooldown > 0;
  const buttonLabel = isSubmitting
    ? "Sending..."
    : cooldown > 0
      ? `Send again in ${cooldown}s`
      : status.kind === "sent" ? "Resend Reset Instructions" : "Send Reset Instructions";

  return (
    <div className="auth-surface min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="auth-panel w-full max-w-lg rounded-[28px] p-6 md:p-8">
          <Link href="/login" className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-primary transition hover:bg-primary/10">
            <ArrowLeft className="size-4" />
            <span className="text-sm font-semibold">Back to login</span>
          </Link>

          <div className="mb-10 text-center">
            <Link href="/" aria-label="Ghar Se Daftar home">
              <LogoFull size="lg" className="mb-8 justify-center" />
            </Link>
            <h1 className="font-serif text-3xl font-semibold text-foreground">Forgot Password</h1>
            <p className="mt-2 text-muted">Enter your account email and we&apos;ll send you a link to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div aria-live="polite">
              {status.kind === "sent" && (
                <div className="flex gap-3 rounded-[18px] border border-success/20 bg-success/10 p-4 text-sm leading-6">
                  <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0 text-success" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Check your inbox</p>
                    <p className="text-muted">{status.message} The link expires after a short time, so use it soon.</p>
                  </div>
                </div>
              )}
              {status.kind === "error" && (
                <div
                  role="alert"
                  className={
                    status.reason === "rate_limited"
                      ? "flex gap-3 rounded-[18px] border border-accent/40 bg-accent/10 p-4 text-sm font-semibold leading-6 text-foreground"
                      : "rounded-[16px] border border-danger/20 bg-danger/10 p-4 text-sm font-semibold text-danger"
                  }
                >
                  {status.reason === "rate_limited" && <Clock3 className="mt-0.5 size-5 flex-shrink-0 text-primary" aria-hidden="true" />}
                  <span>{status.message}</span>
                </div>
              )}
            </div>

            <Input
              icon={Mail}
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register("email")}
              error={errors.email?.message}
              disabled={isSubmitting}
              required
            />

            <div className="space-y-2">
              <Button type="submit" variant="primary" className="w-full" disabled={isDisabled} aria-disabled={isDisabled}>
                {buttonLabel}
              </Button>
              {cooldown > 0 && (
                <p className="text-center text-xs text-muted">You can request another email in {cooldown} seconds.</p>
              )}
            </div>
          </form>

          <div className="mt-8 flex items-center gap-3 rounded-[18px] border border-primary/10 bg-card/75 p-4 text-sm text-muted">
            <LifeBuoy className="size-5 flex-shrink-0 text-primary" aria-hidden="true" />
            <p>
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <a href="mailto:support@gharsedaftar.pk" className="font-semibold text-primary transition hover:opacity-75">
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
