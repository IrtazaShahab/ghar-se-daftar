"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signup } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import Link from "next/link";
import { User, Mail, Phone, Lock, Building2, MapPin, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
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

      if (result.success) {
        router.push("/dashboard/customer");
      } else {
        setError(result.error || "Signup failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-surface min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
          {/* Back link */}
          <Link href="/login" className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-primary transition hover:bg-primary/10">
            <ArrowLeft className="size-4" />
            <span className="text-sm font-semibold">Back to login</span>
          </Link>

          {/* Logo */}
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <Link href="/">
              <LogoFull size="lg" className="justify-center mb-8" />
            </Link>
            <h1 className="font-serif text-4xl font-semibold text-foreground md:text-5xl">Create Your Account</h1>
            <p className="text-muted mt-2">Join thousands enjoying fresh homemade office lunches</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="glass-card mx-auto grid max-w-5xl gap-8 rounded-[28px] p-5 md:p-8 lg:grid-cols-[0.9fr_1.1fr]">
            {error && (
              <div className="rounded-[16px] bg-danger/10 border border-danger/20 p-4 text-sm text-danger font-semibold lg:col-span-2">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <section className="rounded-[24px] border border-border bg-white/65 p-5 md:p-6">
              <h2 className="mb-5 flex items-center gap-2 font-semibold">
                <User className="size-5 text-primary" />
                Personal Information
              </h2>
              <div className="space-y-4">
                <Input
                  label="Full Name"
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
                  placeholder="your@example.com"
                  {...register("email")}
                  error={errors.email?.message}
                  disabled={isLoading}
                  required
                />
                <Input
                  icon={Phone}
                  label="Phone Number"
                  placeholder="+92 300 1234567"
                  {...register("phone")}
                  error={errors.phone?.message}
                  disabled={isLoading}
                  required
                />
                <Input
                  icon={Phone}
                  label="WhatsApp Number"
                  placeholder="+92 300 1234567"
                  {...register("whatsappNumber")}
                  error={errors.whatsappNumber?.message}
                  disabled={isLoading}
                  required
                />
              </div>
            </section>

            {/* Office Information */}
            <section className="rounded-[24px] border border-border bg-white/65 p-5 md:p-6">
              <h2 className="mb-5 flex items-center gap-2 font-semibold">
                <Building2 className="size-5 text-primary" />
                Office Information (Optional)
              </h2>
              <div className="space-y-4">
                <Input
                  label="Company/Office Name"
                  placeholder="Your company name"
                  {...register("companyName")}
                  error={errors.companyName?.message}
                  disabled={isLoading}
                />
                <Input
                  icon={MapPin}
                  label="Delivery Area"
                  placeholder="e.g., Johar Town, Gulberg"
                  {...register("deliveryArea")}
                  error={errors.deliveryArea?.message}
                  disabled={isLoading}
                />
                <Textarea
                  label="Office Address"
                  placeholder="Building name, floor, room number, street"
                  className="min-h-32"
                  {...register("officeAddress")}
                  error={errors.officeAddress?.message}
                  disabled={isLoading}
                />
              </div>
            </section>

            {/* Password */}
            <section className="rounded-[24px] border border-border bg-white/65 p-5 md:p-6 lg:col-span-2">
              <h2 className="mb-5 flex items-center gap-2 font-semibold">
                <Lock className="size-5 text-primary" />
                Security
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Input
                    icon={Lock}
                    label="Password"
                    type="password"
                    placeholder="Create a strong password"
                    {...register("password")}
                    error={errors.password?.message}
                    disabled={isLoading}
                    required
                  />
                  {!errors.password && (
                    <p className="text-xs text-muted mt-2">
                      Min 8 characters • 1 uppercase • 1 lowercase • 1 number
                    </p>
                  )}
                </div>
                <Input
                  icon={Lock}
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  {...register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                  disabled={isLoading}
                  required
                />
              </div>
            </section>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full lg:col-span-2"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Login link */}
          <div className="text-center mt-8">
            <p className="text-muted">Already have an account?{" "}
              <Link href="/login" className="text-primary hover:opacity-75 transition font-semibold">
                Log in
              </Link>
            </p>
          </div>

          {/* Privacy notice */}
          <p className="text-center text-xs text-muted mt-8 max-w-lg mx-auto">
            By creating an account, you agree to our Terms of Service and Privacy Policy. Your data is encrypted and secure.
          </p>
      </div>
    </div>
  );
}
