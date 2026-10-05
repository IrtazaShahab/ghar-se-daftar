"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chooseCorporatePayment, respondToQuote, type QuoteActionResult } from "@/app/actions/corporate";
import type { PaymentMethodOption } from "@/lib/payments/policy";
import { cn } from "@/lib/utils";

function useQuoteAction() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<QuoteActionResult>) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) router.refresh();
        else setError(result.error);
      } catch {
        setError("Couldn't reach the server. Please try again.");
      }
    });
  };

  return { isPending, error, run };
}

export function QuoteDecision({ token }: { token: string }) {
  const { isPending, error, run } = useQuoteAction();

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" disabled={isPending} onClick={() => run(() => respondToQuote(token, "accept"))} className="gap-2">
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Accept quotation
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            if (window.confirm("Decline this quotation? You can still contact us for a revised offer.")) run(() => respondToQuote(token, "reject"));
          }}
        >
          Decline
        </Button>
      </div>
      {error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}
    </div>
  );
}

type CorporateMethod = "BANK_TRANSFER" | "EASYPAISA" | "CARD" | "INVOICE";

export function CorporatePaymentChoice({ token, options, selected }: { token: string; options: PaymentMethodOption[]; selected: string | null }) {
  const { isPending, error, run } = useQuoteAction();

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const active = selected === option.method;
          return (
            <button
              key={option.method}
              type="button"
              disabled={!option.available || isPending}
              onClick={() => run(() => chooseCorporatePayment(token, option.method as CorporateMethod))}
              className={cn(
                "focus-ring rounded-[20px] border p-4 text-left transition disabled:cursor-not-allowed",
                active ? "border-primary bg-primary/5" : "border-border bg-white/70 hover:border-primary/40",
                !option.available && "opacity-60"
              )}
              aria-pressed={active}
            >
              <span className="flex items-center gap-2 font-bold">
                {option.label}
                {!option.available ? <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-extrabold uppercase text-secondary">Coming soon</span> : null}
                {active ? <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-extrabold uppercase text-white">Selected</span> : null}
              </span>
              <span className="mt-1 block text-sm text-muted">{option.available ? option.description : option.unavailableReason}</span>
            </button>
          );
        })}
      </div>
      {isPending ? <p className="text-sm text-muted">Saving your choice…</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}
    </div>
  );
}
