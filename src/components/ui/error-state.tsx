"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shared body for error.tsx boundaries. These only catch unexpected or
 * infrastructure failures (e.g. the database briefly unreachable): sign-in and
 * role problems redirect to /login or /unauthorized, and missing records render
 * not-found, so they never land here. In production Next.js sends only an
 * opaque digest to the browser, never the error message or stack.
 */
export function ErrorState({
  error,
  reset,
  title = "Something went wrong",
  message = "This page couldn't be loaded right now. Please try again in a moment.",
  homeHref = "/"
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
  homeHref?: string;
}) {
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();

  useEffect(() => {
    // Development aid only; production logs are on the server.
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);

  // Re-fetch server data, then clear the boundary.
  const retry = () =>
    startRetry(() => {
      router.refresh();
      reset();
    });

  return (
    <div role="alert" className="mx-auto my-10 max-w-xl rounded-[26px] border border-border bg-card p-8 text-center shadow-lg shadow-primary/5">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent/20 text-secondary">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={retry} disabled={isRetrying} className="gap-2" aria-busy={isRetrying}>
          {isRetrying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
          Try again
        </Button>
        <Link href={homeHref} className="focus-ring inline-flex h-[52px] items-center justify-center rounded-full border border-border bg-white px-6 text-sm font-extrabold text-primary hover:bg-card">
          Go back
        </Link>
      </div>
      {error.digest ? <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p> : null}
    </div>
  );
}
