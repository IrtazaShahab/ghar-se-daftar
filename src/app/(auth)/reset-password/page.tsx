"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/app/actions/auth";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { LogoFull } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await resetPassword(data);
      if (result.success) {
        router.replace("/login");
        return;
      }
      setError(result.error || "Unable to reset password.");
    } catch {
      setError("An unexpected error occurred. Please request a new reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-surface min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="auth-panel w-full max-w-md rounded-[28px] p-6 md:p-8">
          <Link href="/">
            <LogoFull size="lg" className="mb-8 justify-center" />
          </Link>
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-semibold">Create a new password</h1>
            <p className="mt-2 text-muted">Use at least 8 characters with uppercase, lowercase, and a number.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-[16px] border border-danger/20 bg-danger/10 p-4 text-sm font-semibold text-danger">
                {error}
              </div>
            )}
            <Input
              icon={Lock}
              label="New Password"
              type="password"
              {...register("password")}
              error={errors.password?.message}
              disabled={isLoading}
              required
            />
            <Input
              icon={Lock}
              label="Confirm New Password"
              type="password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              required
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
