"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CustomerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="We couldn’t load this page"
      message="Please try again. If the problem continues, contact Ghar Se Daftar support."
      homeHref="/"
    />
  );
}
