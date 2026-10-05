"use client";

import { useCart } from "@/store/cart";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { AlertCircle, ArrowLeft, Banknote, Building2, Clock, CreditCard, Loader2, Lock, ShoppingBag, Smartphone, User } from "lucide-react";
import Link from "next/link";
import { generateWhatsAppOrderMessage } from "@/lib/order";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { getCheckoutQuote, placeOrder, type CheckoutQuote } from "@/app/actions/order";
import { checkoutDetailsSchema, type CheckoutDetailsInput, type CustomerPaymentMethod } from "@/lib/validations/checkout";
import { DELIVERY_SLOTS, formatDeliveryFee, formatRs } from "@/lib/orders/format";
import { FREE_DELIVERY_MESSAGE, amountToFreeDelivery } from "@/lib/orders/pricing";
import { cn } from "@/lib/utils";

export type CheckoutDefaults = {
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  company: string;
  area: string;
  address: string;
  instructions: string;
};

const PAYMENT_ICONS: Record<CustomerPaymentMethod, typeof Banknote> = {
  EASYPAISA: Smartphone,
  COD: Banknote,
  CARD: CreditCard
};

/** UUID v4; crypto.randomUUID is missing on non-HTTPS origins (e.g. testing over LAN). */
function newIdempotencyKey() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function SectionTitle({ step, icon: Icon, children }: { step: number; icon: typeof User; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold tracking-tight">
      <span className="grid size-8 place-items-center rounded-full bg-primary text-sm text-white">{step}</span>
      <Icon className="size-5 text-primary" aria-hidden="true" />
      {children}
    </h2>
  );
}

export function CheckoutForm({ defaults }: { defaults: CheckoutDefaults }) {
  const router = useRouter();
  const { state, dispatch } = useCart();
  const items = state.items;

  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [isQuoting, startQuote] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per checkout visit: a double click or retry returns the same order.
  const [idempotencyKey] = useState(newIdempotencyKey);

  const cartLines = useMemo(() => items.map((item) => ({ menuOptionId: item.menuOptionId, quantity: item.quantity })), [items]);
  const cartSignature = JSON.stringify(cartLines);

  useEffect(() => {
    if (cartLines.length === 0) return;
    let cancelled = false;
    startQuote(async () => {
      const result = await getCheckoutQuote(cartLines).catch(
        (): CheckoutQuote => ({ success: false, error: "We couldn't load current prices. Please refresh and try again." })
      );
      if (!cancelled) setQuote(result);
    });
    return () => {
      cancelled = true;
    };
    // cartSignature captures every change to ids/quantities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    control
  } = useForm<CheckoutDetailsInput>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: {
      fullName: defaults.fullName,
      phone: defaults.phone,
      whatsappNumber: defaults.whatsappNumber,
      company: defaults.company,
      area: defaults.area,
      address: defaults.address,
      instructions: defaults.instructions,
      deliverySlot: "",
      paymentMethod: "COD"
    }
  });

  const watched = useWatch({ control });
  const selectedMethod = watched.paymentMethod;

  const paymentOptions = useMemo(() => (quote?.success ? quote.paymentOptions : []), [quote]);
  const unavailableIds = useMemo(() => (quote?.success ? quote.unavailableIds : []), [quote]);
  const totals = quote?.success ? quote.totals : null;

  // If the selected method becomes unavailable, fall back to COD.
  useEffect(() => {
    const selected = paymentOptions.find((option) => option.method === selectedMethod);
    if (selected && !selected.available) setValue("paymentMethod", "COD");
  }, [paymentOptions, selectedMethod, setValue]);

  const removeUnavailable = useCallback(() => {
    items.filter((item) => unavailableIds.includes(item.menuOptionId)).forEach((item) => dispatch({ type: "REMOVE_ITEM", payload: item.id }));
    setError(null);
  }, [dispatch, items, unavailableIds]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="mx-auto mb-6 w-fit rounded-full bg-primary/10 p-6">
          <ShoppingBag className="size-10 text-primary" />
        </div>
        <h1 className="font-serif text-3xl font-semibold">Your cart is empty</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">Add meals from this week&rsquo;s menu before checking out.</p>
        <Link href="/menu" className="focus-ring mt-8 inline-flex h-[52px] items-center justify-center rounded-full bg-primary px-6 text-sm font-extrabold text-white shadow-lg shadow-primary/15 hover:bg-[#183f28]">
          Browse the menu
        </Link>
      </div>
    );
  }

  const selectedOption = paymentOptions.find((option) => option.method === selectedMethod);
  const canSubmit = Boolean(totals) && unavailableIds.length === 0 && !isQuoting && !isSubmitting && Boolean(selectedOption?.available);

  const onSubmit = async (data: CheckoutDetailsInput) => {
    if (isSubmitting || !canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await placeOrder({ ...data, items: cartLines, idempotencyKey });

      if (result.success) {
        dispatch({ type: "CLEAR_CART" });
        if (/^https?:\/\//.test(result.redirectTo)) {
          window.location.assign(result.redirectTo);
        } else {
          router.replace(result.redirectTo);
        }
        return; // keep the button disabled while navigating away
      }

      setError(result.error);
      if (result.unavailableItemIds?.length) setQuote(await getCheckoutQuote(cartLines));
    } catch {
      setError("We couldn't reach our servers. Check your connection and try again.");
    }

    setIsSubmitting(false);
  };

  const whatsappMessage = generateWhatsAppOrderMessage(
    items,
    {
      fullName: watched.fullName ?? "",
      phone: watched.phone ?? "",
      whatsappNumber: watched.whatsappNumber ?? "",
      company: watched.company ?? "",
      area: watched.area ?? "",
      address: watched.address ?? "",
      deliverySlot: watched.deliverySlot ?? "",
      instructions: watched.instructions ?? ""
    },
    totals?.subtotal ?? 0,
    totals?.deliveryFee ?? 0,
    totals?.total ?? 0
  );

  const summary = (
    <div className="glass-card space-y-5 rounded-[28px] p-6">
      <h2 className="font-serif text-2xl font-semibold">Order summary</h2>

      {isQuoting && !totals ? (
        <div className="space-y-3" aria-label="Loading prices">
          <Skeleton className="h-10 rounded-2xl" />
          <Skeleton className="h-10 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : quote && !quote.success ? (
        <p role="alert" className="rounded-2xl bg-danger/10 p-4 text-sm font-semibold text-danger">{quote.error}</p>
      ) : (
        <>
          <ul className="max-h-64 space-y-3 overflow-y-auto">
            {items.map((item) => {
              const line = quote?.success ? quote.lines.find((candidate) => candidate.menuOptionId === item.menuOptionId) : undefined;
              const unavailable = unavailableIds.includes(item.menuOptionId);
              return (
                <li key={item.id} className={cn("flex justify-between gap-3 text-sm", unavailable && "opacity-60")}>
                  <div className="min-w-0">
                    <p className="font-semibold">{line?.name ?? item.name}</p>
                    <p className="text-xs text-muted">
                      {line?.day ?? item.day} · {item.quantity} × {formatRs(line?.unitPrice ?? item.price)}
                    </p>
                    {unavailable ? <p className="mt-1 text-xs font-bold text-danger">No longer available</p> : null}
                  </div>
                  <p className="shrink-0 font-semibold">{line ? formatRs(line.lineTotal) : "—"}</p>
                </li>
              );
            })}
          </ul>

          {unavailableIds.length > 0 ? (
            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm">
              <p className="font-semibold text-danger">Some items are no longer on the menu.</p>
              <button type="button" onClick={removeUnavailable} className="focus-ring mt-2 text-sm font-bold text-primary underline">
                Remove unavailable items
              </button>
            </div>
          ) : null}

          {totals ? (
            <dl className={cn("space-y-3 border-t border-border pt-4 text-sm transition-opacity", isQuoting && "opacity-60")}>
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold">{formatRs(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className={cn("font-semibold", totals.deliveryFee === 0 && "text-success")}>{formatDeliveryFee(totals.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd className="font-semibold">{totals.discount > 0 ? `− ${formatRs(totals.discount)}` : formatRs(0)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="font-serif text-2xl font-semibold text-primary">{formatRs(totals.total)}</dd>
              </div>
              <p className="rounded-2xl bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                {amountToFreeDelivery(totals.subtotal) > 0
                  ? `${FREE_DELIVERY_MESSAGE} Add ${formatRs(amountToFreeDelivery(totals.subtotal))} more to qualify.`
                  : `${FREE_DELIVERY_MESSAGE} Your order qualifies.`}
              </p>
            </dl>
          ) : null}
        </>
      )}

      <p className="flex items-start gap-2 border-t border-border pt-4 text-xs text-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
        Prices and delivery are confirmed on our server from the current menu when you place your order.
      </p>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0">
        <Link href="/menu" className="mb-8 inline-flex items-center gap-2 text-primary transition hover:opacity-75">
          <ArrowLeft className="size-4" />
          <span className="text-sm font-semibold">Back to menu</span>
        </Link>

        <h1 className="mb-2 font-serif text-4xl font-semibold">Checkout</h1>
        <p className="mb-8 text-muted">Confirm your details, choose how to pay and place your order.</p>

        <div className="mb-8 lg:hidden">{summary}</div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
          <section className="glass-card rounded-[28px] p-6">
            <SectionTitle step={1} icon={User}>Customer information</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Full name" autoComplete="name" placeholder="Your full name" {...register("fullName")} error={errors.fullName?.message} disabled={isSubmitting} required />
              </div>
              <Input label="Phone number" type="tel" autoComplete="tel" placeholder="0300 1234567" {...register("phone")} error={errors.phone?.message} disabled={isSubmitting} required />
              <Input label="WhatsApp number (optional)" type="tel" placeholder="0300 1234567" {...register("whatsappNumber")} error={errors.whatsappNumber?.message} disabled={isSubmitting} />
              <div className="sm:col-span-2">
                <Input label="Email" type="email" value={defaults.email} readOnly disabled helpText="Your order confirmation is sent to your account email." />
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[28px] p-6">
            <SectionTitle step={2} icon={Building2}>Delivery address</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Company / office (optional)" autoComplete="organization" placeholder="Your company name" {...register("company")} error={errors.company?.message} disabled={isSubmitting} />
              <Input label="Delivery area" placeholder="e.g. Gulberg, Johar Town" {...register("area")} error={errors.area?.message} disabled={isSubmitting} required />
              <div className="sm:col-span-2">
                <Textarea label="Full office address" autoComplete="street-address" placeholder="Building, floor, office number, street" {...register("address")} error={errors.address?.message} disabled={isSubmitting} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <label htmlFor="deliverySlot" className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="size-4 text-primary" aria-hidden="true" />
                  Preferred delivery time
                </label>
                <select
                  id="deliverySlot"
                  {...register("deliverySlot")}
                  disabled={isSubmitting}
                  className={cn(
                    "focus-ring h-[52px] w-full rounded-[18px] border border-border bg-white/85 px-4 text-sm transition hover:border-primary/30 focus:border-primary",
                    errors.deliverySlot && "border-danger bg-danger/5"
                  )}
                >
                  <option value="">Select a time</option>
                  {DELIVERY_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
                {errors.deliverySlot ? <span className="text-xs font-semibold text-danger">{errors.deliverySlot.message}</span> : null}
                <span className="text-xs text-muted">Each meal is delivered on its menu day. Same-day orders are accepted until 10:30 AM.</span>
              </div>
              <div className="sm:col-span-2">
                <Textarea label="Delivery instructions (optional)" placeholder="e.g. Meet at reception, call on arrival" {...register("instructions")} error={errors.instructions?.message} disabled={isSubmitting} />
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[28px] p-6">
            <SectionTitle step={3} icon={CreditCard}>Payment method</SectionTitle>
            {paymentOptions.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            ) : (
              <fieldset className="grid gap-3" disabled={isSubmitting}>
                <legend className="sr-only">Choose a payment method</legend>
                {paymentOptions.map((option) => {
                  const Icon = PAYMENT_ICONS[option.method as CustomerPaymentMethod] ?? CreditCard;
                  const checked = selectedMethod === option.method;
                  return (
                    <label
                      key={option.method}
                      className={cn(
                        "flex items-start gap-4 rounded-[20px] border p-4 transition",
                        option.available ? "cursor-pointer hover:border-primary/40" : "cursor-not-allowed opacity-60",
                        checked ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white/70"
                      )}
                    >
                      <input
                        type="radio"
                        value={option.method}
                        disabled={!option.available}
                        {...register("paymentMethod")}
                        className="mt-1 size-4 accent-[#214f32]"
                      />
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10">
                        <Icon className="size-5 text-primary" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 font-bold">
                          {option.label}
                          {!option.available ? (
                            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-secondary">Coming soon</span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-sm text-muted">{option.available ? option.description : option.unavailableReason}</span>
                        {checked && option.method === "COD" && totals ? (
                          <span className="mt-2 block text-sm font-semibold text-primary">Please keep {formatRs(totals.total)} ready when your meal arrives.</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )}
            {errors.paymentMethod ? <p className="mt-2 text-xs font-semibold text-danger">{errors.paymentMethod.message}</p> : null}
          </section>

          <div className="lg:hidden">{summary}</div>

          {error ? (
            <div role="alert" className="flex items-start gap-3 rounded-[16px] border border-danger/20 bg-danger/10 p-4 text-sm font-semibold text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          ) : null}

          <div className="space-y-3">
            <Button type="submit" variant="primary" className="w-full gap-2" disabled={!canSubmit} aria-busy={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Placing your order…
                </>
              ) : totals ? (
                `Place Order · ${formatRs(totals.total)}`
              ) : (
                "Place Order"
              )}
            </Button>
            <WhatsAppButton message={whatsappMessage} variant="inline" className="w-full" />
          </div>
        </form>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24">{summary}</div>
      </aside>
    </div>
  );
}
