"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PASSWORD_HINT, signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signup } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import Link from "next/link";
import { User, Mail, Lock, ArrowLeft, MailCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signup(data);

      if (!result.success) {
        setError(result.error || "Signup failed");
      } else if (result.requiresEmailConfirmation) {
        setConfirmationSentTo(data.email);
      } else {
        router.replace("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-surface min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="auth-panel w-full max-w-lg rounded-[28px] p-6 md:p-8">
          <Link href="/login" className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-primary transition hover:bg-primary/10">
            <ArrowLeft className="size-4" />
            <span className="text-sm font-semibold">Back to login</span>
          </Link>

          <div className="mb-8 text-center">
            <Link href="/" aria-label="Ghar Se Daftar home">
              <LogoFull size="lg" className="mb-8 justify-center" />
            </Link>
            <h1 className="font-serif text-3xl font-semibold text-foreground">Create Account</h1>
            <p className="mt-2 text-muted">Fresh homemade lunches, delivered to your office.</p>
          </div>

          {confirmationSentTo ? (
            <div className="space-y-6 text-center" aria-live="polite">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-success">
                <MailCheck className="size-7" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Confirm your email</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  We sent a confirmation link to <strong className="text-foreground">{confirmationSentTo}</strong>.
                  Open it to activate your account, then log in.
                </p>
              </div>
              <ButtonLink href="/login" className="w-full">Back to Login</ButtonLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {error && (
                <div role="alert" className="rounded-[16px] border border-danger/20 bg-danger/10 p-4 text-sm font-semibold text-danger">
                  {error}
                </div>
              )}

              <Input
                icon={User}
                label="Full Name"
                autoComplete="name"
                placeholder="Your full name"
                {...register("fullName")}
                error={errors.fullName?.message}
                disabled={isLoading}
                required
              />
              <Input
                icon={Mail}
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register("email")}
                error={errors.email?.message}
                disabled={isLoading}
                required
              />
              <Input
                icon={Lock}
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                helpText={PASSWORD_HINT}
                {...register("password")}
                error={errors.password?.message}
                disabled={isLoading}
                required
              />
              <Input
                icon={Lock}
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
                disabled={isLoading}
                required
              />

              <p className="rounded-[18px] border border-primary/10 bg-primary/5 px-4 py-3 text-xs leading-5 text-muted">
                You&apos;ll add your office and delivery details at checkout.
              </p>

              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary transition hover:opacity-75">
              Log In
            </Link>
          </p>

          <p className="mx-auto mt-6 max-w-sm text-center text-xs text-muted">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
