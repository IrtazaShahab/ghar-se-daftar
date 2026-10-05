"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Admin data couldn’t be loaded"
      message="We couldn’t reach the database just now. Please try again."
      homeHref="/admin"
    />
  );
}
