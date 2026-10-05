"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";

const DANGER = "border border-danger/25 bg-white text-danger hover:bg-danger/10 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return result.ok ? (
    result.message ? <p role="status" className="text-xs font-semibold text-success">{result.message}</p> : null
  ) : (
    <p role="alert" className="text-xs font-semibold text-danger">{result.error}</p>
  );
}

/**
 * Runs a bound server action (e.g. `markReady.bind(null, orderId)`), then
 * refreshes server data. Disabled while pending so it can't double-submit.
 */
export function ActionButton({
  action,
  children,
  variant = "primary",
  confirmMessage,
  className
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  variant?: Variant;
  confirmMessage?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const run = () => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setResult(null);
    startTransition(async () => {
      try {
        const outcome = await action();
        setResult(outcome);
        if (outcome.ok) router.refresh();
      } catch {
        setResult({ ok: false, error: "Couldn't reach the server. Please try again." });
      }
    });
  };

  return (
    <div className="grid gap-1.5">
      <Button
        type="button"
        onClick={run}
        disabled={isPending}
        variant={variant === "danger" ? "secondary" : variant}
        className={cn("h-11 gap-2 px-5", variant === "danger" && DANGER, className)}
        aria-busy={isPending}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {children}
      </Button>
      <Feedback result={result} />
    </div>
  );
}

/** A form bound to a server action taking FormData. Resets on success when asked. */
export function ActionForm({
  action,
  children,
  submitLabel,
  submitVariant = "primary",
  resetOnSuccess = false,
  className,
  confirmMessage
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel: string;
  submitVariant?: Variant;
  resetOnSuccess?: boolean;
  className?: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const formData = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      try {
        const outcome = await action(formData);
        setResult(outcome);
        if (outcome.ok) {
          if (resetOnSuccess) formRef.current?.reset();
          router.refresh();
        }
      } catch {
        setResult({ ok: false, error: "Couldn't reach the server. Please try again." });
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className={cn("grid gap-4", className)}>
      <fieldset disabled={isPending} className="grid gap-4">
        {children}
      </fieldset>
      <div className="grid gap-1.5">
        <Button
          type="submit"
          disabled={isPending}
          variant={submitVariant === "danger" ? "secondary" : submitVariant}
          className={cn("h-11 gap-2 px-5", submitVariant === "danger" && DANGER)}
          aria-busy={isPending}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {submitLabel}
        </Button>
        <Feedback result={result} />
      </div>
    </form>
  );
}
