"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import Link from "next/link";
import { Mail, ArrowLeft, LifeBuoy } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedTo, setSubmittedTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);

    try {
      // TODO: Implement OTP/reset link sending via:
      // - Email service (SendGrid, AWS SES)
      // - SMS service (Twillio, AWS SNS)

      // Placeholder: just show success
      await new Promise(resolve => setTimeout(resolve, 800));
      setSubmittedTo(data.emailOrPhone);
      setSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-surface min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="auth-panel w-full max-w-lg rounded-[28px] p-6 md:p-8">
          {/* Back link */}
          <Link href="/login" className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-primary transition hover:bg-primary/10">
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
              <div className="rounded-[18px] border border-primary/10 bg-primary/5 p-4 text-sm leading-6 text-muted">
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
                <h2 className="font-semibold text-foreground mb-2">Check your {submittedTo.includes("@") ? "email" : "phone"}</h2>
                <p className="text-sm text-muted">
                  We've sent password reset instructions to <strong>{submittedTo}</strong>
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-[16px] bg-white/50 border border-border text-sm">
                <p className="font-semibold text-foreground">Next steps:</p>
                <ol className="space-y-2 text-muted">
                  <li>1. Check your {submittedTo.includes("@") ? "email inbox" : "SMS messages"}</li>
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
          <div className="mt-8 flex items-center gap-3 rounded-[18px] border border-primary/10 bg-card/75 p-4 text-sm text-muted">
            <LifeBuoy className="size-5 flex-shrink-0 text-primary" />
            <p>
              Didn't receive the email? Check your spam folder or{" "}
              <Link href="#" className="text-primary hover:opacity-75 transition font-semibold">
                contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
