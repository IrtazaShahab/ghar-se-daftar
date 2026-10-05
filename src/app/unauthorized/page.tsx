import { ButtonLink } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import { AlertCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { homePathForRole } from "@/lib/auth/guards";

export const metadata = {
  title: "Access Denied",
  description: "You don't have permission to access this page"
};

export const dynamic = "force-dynamic";

export default async function UnauthorizedPage() {
  const user = await getCurrentUser();
  const dashboardHref = user ? homePathForRole(user.role) : "/login";

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
          <ButtonLink href={dashboardHref} variant="secondary" className="w-full">
            {user ? "Go to my dashboard" : "Log in"}
          </ButtonLink>
        </div>

        <p className="text-xs text-muted mt-8">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
