"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const emailOrPhone = watch("emailOrPhone");

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);

    try {
      // TODO: Implement OTP/reset link sending via:
      // - Email service (SendGrid, AWS SES)
      // - SMS service (Twillio, AWS SNS)

      // Placeholder: just show success
      await new Promise(resolve => setTimeout(resolve, 800));
      setSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
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
            <h1 className="font-serif text-3xl font-semibold text-foreground">Reset Password</h1>
            <p className="text-muted mt-2">We'll send you instructions to reset it</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-[16px] bg-primary/5 border border-primary/10 p-4 text-sm text-muted">
                Enter the email or phone number associated with your account.
              </div>

              <Input
                icon={Mail}
                label="Email or Phone"
                placeholder="user@example.com or +92 300 1234567"
                {...register("emailOrPhone")}
                error={errors.emailOrPhone?.message}
                disabled={isLoading}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[20px] bg-success/10 border border-success/20 p-6 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h2 className="font-semibold text-foreground mb-2">Check your {emailOrPhone.includes("@") ? "email" : "phone"}</h2>
                <p className="text-sm text-muted">
                  We've sent password reset instructions to <strong>{emailOrPhone}</strong>
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-[16px] bg-white/50 border border-border text-sm">
                <p className="font-semibold text-foreground">Next steps:</p>
                <ol className="space-y-2 text-muted">
                  <li>1. Check your {emailOrPhone.includes("@") ? "email inbox" : "SMS messages"}</li>
                  <li>2. Click the reset link or enter the code</li>
                  <li>3. Create a new password</li>
                  <li>4. Log in with your new password</li>
                </ol>
              </div>

              <Button variant="secondary" className="w-full" onClick={() => setSubmitted(false)}>
                Try Another Email/Phone
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-primary hover:opacity-75 transition font-semibold text-sm">
                  Back to login
                </Link>
              </div>
            </div>
          )}

          {/* Support message */}
          <div className="mt-12 p-4 rounded-[16px] bg-primary/5 border border-primary/10 text-center text-sm text-muted">
            Didn't receive the email? Check your spam folder or{" "}
            <Link href="#" className="text-primary hover:opacity-75 transition font-semibold">
              contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
