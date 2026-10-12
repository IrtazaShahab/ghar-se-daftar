"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function RiderError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Couldn’t load this right now"
      message="Please try again. If it keeps happening, contact the Ghar Se Daftar team."
      homeHref="/rider"
    />
  );
}
