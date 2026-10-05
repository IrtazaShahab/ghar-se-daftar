"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Something went wrong"
      message="This page couldn’t be loaded right now. Please try again in a moment."
      homeHref="/"
    />
  );
}
