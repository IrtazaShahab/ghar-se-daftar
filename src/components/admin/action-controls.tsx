"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { useOptimisticStatus, type StatusPatch } from "@/components/orders/optimistic-status";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";

const DANGER = "border border-danger/25 bg-white text-danger hover:bg-danger/10 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";
const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

function Feedback({ result, onRetry }: { result: ActionResult | null; onRetry?: () => void }) {
  if (!result) return null;
  return result.ok ? (
    result.message ? <p role="status" className="text-xs font-semibold text-success">{result.message}</p> : null
  ) : (
    <p role="alert" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-danger">
      {result.error}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="focus-ring inline-flex items-center gap-1 rounded-full underline underline-offset-2">
          <RotateCcw className="size-3" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </p>
  );
}

/**
 * Runs a bound server action (e.g. `markReady.bind(null, orderId)`).
 *
 * The actions call revalidatePath, so their response already carries the
 * re-rendered page: no router.refresh() (that used to render everything a
 * second time). `refresh` is only for actions that don't revalidate.
 * `optimistic` patches the surrounding OptimisticStatusProvider immediately;
 * it is rolled back automatically if the action fails.
 */
export function ActionButton({
  action,
  children,
  variant = "primary",
  confirmMessage,
  className,
  pendingLabel,
  optimistic,
  refresh = false
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  variant?: Variant;
  confirmMessage?: string;
  className?: string;
  pendingLabel?: string;
  optimistic?: StatusPatch;
  refresh?: boolean;
}) {
  const router = useRouter();
  const live = useOptimisticStatus();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const execute = () => {
    setResult(null);
    startTransition(async () => {
      if (optimistic) live?.apply(optimistic);
      try {
        const outcome = await action();
        setResult(outcome);
        if (outcome.ok && refresh) router.refresh();
      } catch {
        setResult({ ok: false, error: NETWORK_ERROR });
      }
    });
  };

  const run = () => {
    if (isPending) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    execute();
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
        {isPending && pendingLabel ? pendingLabel : children}
      </Button>
      <Feedback result={result} onRetry={result && !result.ok ? execute : undefined} />
    </div>
  );
}

/** A form bound to a server action taking FormData. Resets on success when asked. */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  submitVariant = "primary",
  resetOnSuccess = false,
  className,
  confirmMessage,
  refresh = false
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  submitVariant?: Variant;
  resetOnSuccess?: boolean;
  className?: string;
  confirmMessage?: string;
  refresh?: boolean;
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
          if (refresh) router.refresh();
        }
      } catch {
        setResult({ ok: false, error: NETWORK_ERROR });
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className={cn("grid gap-4", className)}>
      <fieldset disabled={isPending} className="grid min-w-0 gap-4">
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
          {isPending && pendingLabel ? pendingLabel : submitLabel}
        </Button>
        <Feedback result={result} />
      </div>
    </form>
  );
}
