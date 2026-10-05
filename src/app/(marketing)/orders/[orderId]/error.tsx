"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function OrderTrackingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Order tracking is unavailable right now"
      message="Your order is safe. We just couldn’t load its latest status. Please try again."
      homeHref="/dashboard/customer/orders"
    />
  );
}
