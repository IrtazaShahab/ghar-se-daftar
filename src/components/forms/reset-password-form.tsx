"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock } from "lucide-react";
import { resetPassword } from "@/app/actions/auth";
import { PASSWORD_HINT, resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState = "editing" | "done" | "expired";

export function ResetPasswordForm({ email }: { email: string | null }) {
  const [state, setState] = useState<FormState>("editing");
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);

    try {
      const result = await resetPassword(data);
      if (result.success) {
        setState("done");
        return;
      }
      if (result.reason === "session_expired") setState("expired");
      setError(result.error);
    } catch {
      setError("We couldn't reach our servers. Check your connection and try again.");
    }
  };

  if (state === "done") {
    return (
      <div className="space-y-6 text-center" aria-live="polite">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Password updated successfully.</h1>
          <p className="mt-3 text-muted">Your password has been changed. You can now sign in using your new password.</p>
        </div>
        <ButtonLink href="/login" className="w-full">Back to Login</ButtonLink>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="space-y-6 text-center" role="alert">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Link expired</h1>
          <p className="mt-3 text-muted">{error}</p>
        </div>
        <ButtonLink href="/forgot-password" className="w-full">Request a new reset link</ButtonLink>
      </div>
    );
  }

  const isBusy = isSubmitting;

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Reset Password</h1>
        <p className="mt-2 text-muted">Choose a new password for your Ghar Se Daftar account.</p>
        {email && <p className="mt-2 text-sm font-semibold text-foreground">{email}</p>}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && (
          <div role="alert" className="rounded-[16px] border border-danger/20 bg-danger/10 p-4 text-sm font-semibold text-danger">
            {error}
          </div>
        )}
        {/* Lets password managers attach the new password to the right account. */}
        {email && <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />}
        <Input
          icon={Lock}
          label="New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          helpText={PASSWORD_HINT}
          {...register("password")}
          error={errors.password?.message}
          disabled={isBusy}
          required
        />
        <Input
          icon={Lock}
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
          disabled={isBusy}
          required
        />
        <Button type="submit" className="w-full" disabled={isBusy}>
          {isBusy ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </>
  );
}
