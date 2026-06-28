import { Button, ButtonLink } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Access Denied",
  description: "You don't have permission to access this page"
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-primary/5 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex justify-center mb-8">
          <LogoFull size="lg" />
        </div>

        <div className="inline-flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertCircle className="size-8 text-danger" />
          </div>
        </div>

        <h1 className="font-serif text-4xl font-semibold mb-3">Access Denied</h1>
        <p className="text-muted mb-8">
          You don't have permission to access this page. Your account role doesn't grant access to this resource.
        </p>

        <div className="space-y-3">
          <ButtonLink href="/" variant="primary" className="w-full">
            Back to Home
          </ButtonLink>
          <ButtonLink href="/dashboard/customer" variant="secondary" className="w-full">
            Go to Dashboard
          </ButtonLink>
        </div>

        <p className="text-xs text-muted mt-8">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
