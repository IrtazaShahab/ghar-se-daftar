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
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-primary/5">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main container */}
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back link */}
          <Link href="/login" className="inline-flex items-center gap-2 text-primary hover:opacity-75 transition mb-8">
            <ArrowLeft className="size-4" />
            <span className="text-sm font-semibold">Back to login</span>
          </Link>

          {/* Logo */}
          <div className="text-center mb-12">
            <Link href="/">
              <LogoFull size="lg" className="justify-center mb-8" />
            </Link>
            <h1 className="font-serif text-4xl font-semibold text-foreground">Create Your Account</h1>
            <p className="text-muted mt-2">Join thousands enjoying fresh homemade office lunches</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 glass-card rounded-[28px] p-8 md:p-12">
            {error && (
              <div className="rounded-[16px] bg-danger/10 border border-danger/20 p-4 text-sm text-danger font-semibold">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
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
            </div>

            {/* Office Information */}
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
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
                  {...register("officeAddress")}
                  error={errors.officeAddress?.message}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Lock className="size-5 text-primary" />
                Security
              </h2>
              <div className="space-y-4">
                <div>
                  <Input
                    icon={Lock}
                    label="Password"
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
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
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
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
    </div>
  );
}
