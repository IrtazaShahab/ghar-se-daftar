"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { login } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import Link from "next/link";
import { Mail, Lock, ChefHat, ShieldCheck, Clock3, CheckCircle2 } from "lucide-react";

const STAFF_HOME: Record<string, string> = {
  ADMIN: "/admin",
  HOME_CHEF: "/chef",
  CORPORATE_ADMIN: "/dashboard/corporate"
};

/**
 * Returning users go back to where they were headed (e.g. /checkout) when the
 * `next` path is same-origin; otherwise customers go home and staff to their area.
 */
function loginDestination(role: string | undefined, next: string | null) {
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : null;
  if (role && STAFF_HOME[role]) {
    const area = STAFF_HOME[role];
    return safeNext && safeNext.startsWith(area) ? safeNext : area;
  }
  return safeNext ?? "/";
}

/** Shown after a successful password reset (the reset action redirects here). */
function PasswordResetNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("reset") !== "success") return null;
  return (
    <div role="status" className="flex items-start gap-3 rounded-[16px] border border-success/20 bg-success/10 p-4 text-sm font-semibold text-success">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      Password updated successfully. Log in with your new password.
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const trustItems = [
    { Icon: ChefHat, text: "Verified home chefs" },
    { Icon: ShieldCheck, text: "Secure ordering" },
    { Icon: Clock3, text: "Daily lunch tracking" }
  ];

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(data);

      if (result.success) {
        router.replace(loginDestination(result.role, new URLSearchParams(window.location.search).get("next")));
        router.refresh();
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-surface min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 md:px-8 lg:grid-cols-[0.9fr_1fr]">
        <section className="hidden rounded-[28px] border border-primary/10 bg-primary p-8 text-white shadow-2xl shadow-primary/15 lg:block">
          <LogoFull size="lg" className="[&_*]:text-white" />
          <div className="mt-16 max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">Office lunch, simplified</p>
            <h2 className="mt-4 font-serif text-5xl font-semibold leading-tight">Fresh ghar ka khana at work.</h2>
            <p className="mt-5 text-sm leading-6 text-white/75">
              Manage your meals, orders, and delivery updates from one calm dashboard.
            </p>
          </div>
          <div className="mt-14 grid gap-3 text-sm">
            {trustItems.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <Icon className="size-5" />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </section>

        <main className="w-full">
          <div className="auth-panel mx-auto w-full max-w-md rounded-[28px] p-6 md:p-8">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/">
              <LogoFull size="lg" className="mb-7 justify-center lg:hidden" />
            </Link>
            <h1 className="font-serif text-3xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-muted mt-2">Track your office lunch orders</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Suspense fallback={null}>
              <PasswordResetNotice />
            </Suspense>
            {error && (
              <div className="rounded-[16px] bg-danger/10 border border-danger/20 p-4 text-sm text-danger font-semibold">
                {error}
              </div>
            )}

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
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register("password")}
              error={errors.password?.message}
              disabled={isLoading}
              required
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-primary/5 px-4 py-3">
              <input
                type="checkbox"
                {...register("rememberMe")}
                disabled={isLoading}
                className="size-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium text-muted">Remember me for 60 days</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          {/* Forgot password link */}
          <div className="text-center mt-6">
            <Link href="/forgot-password" className="text-primary hover:opacity-75 transition font-semibold text-sm">
              Forgot Password?
            </Link>
          </div>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted">New to Ghar Se Daftar?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Sign up link */}
          <Link href="/signup">
            <Button variant="secondary" className="w-full">
              Create Account
            </Button>
          </Link>

          {/* Trust section */}
          <div className="mt-8 grid gap-3 rounded-[22px] border border-border bg-card/70 p-5">
            <div className="flex items-start gap-3">
              <ChefHat className="size-5 text-primary flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Verified Home Chefs</p>
                <p className="text-muted text-xs">All kitchens are verified and inspected</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ChefHat className="size-5 text-primary flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Secure Ordering</p>
                <p className="text-muted text-xs">Your data is encrypted and safe</p>
              </div>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
