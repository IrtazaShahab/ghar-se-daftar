"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function ChefError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Orders couldn’t be loaded right now"
      message="Please try again. If it keeps happening, contact the Ghar Se Daftar team."
      homeHref="/chef"
    />
  );
}
