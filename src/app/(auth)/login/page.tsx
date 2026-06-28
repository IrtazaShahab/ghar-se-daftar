"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { login } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import Link from "next/link";
import { Mail, Lock, ChefHat } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        // Redirect based on role
        const dashboardRoute = `/dashboard/${result.role === "ADMIN" ? "admin" : result.role === "CORPORATE_ADMIN" ? "corporate" : result.role === "HOME_CHEF" ? "chef" : "customer"}`;
        router.push(dashboardRoute);
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
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-primary/5">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-12">
            <Link href="/">
              <LogoFull size="lg" className="justify-center mb-8" />
            </Link>
            <h1 className="font-serif text-3xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-muted mt-2">Track your office lunch orders</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-[16px] bg-danger/10 border border-danger/20 p-4 text-sm text-danger font-semibold">
                {error}
              </div>
            )}

            <Input
              icon={Mail}
              label="Email or Phone"
              placeholder="user@example.com or +92 300 1234567"
              {...register("emailOrPhone")}
              error={errors.emailOrPhone?.message}
              disabled={isLoading}
              required
            />

            <Input
              icon={Lock}
              label="Password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              error={errors.password?.message}
              disabled={isLoading}
              required
            />

            <label className="flex items-center gap-2 cursor-pointer">
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
              Forgot password?
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
          <div className="mt-12 p-6 rounded-[20px] bg-white/80 border border-border space-y-3">
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
      </div>
    </div>
  );
}
