"use client";

import { useCart } from "@/store/cart";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { ArrowLeft, Phone, User, Building2, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { generateWhatsAppOrderMessage, getDeliveryFee, isValidPhoneNumber } from "@/lib/order";
import { useState, useTransition } from "react";
import { submitOrder } from "@/app/actions/order";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(80),
  phone: z.string().min(10, "Valid phone number required").refine(isValidPhoneNumber, "Invalid phone number"),
  whatsappNumber: z.string().min(10, "Valid phone number required").refine(isValidPhoneNumber, "Invalid phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  company: z.string().min(2, "Company/office name is required").max(120),
  area: z.string().min(2, "Delivery area is required").max(120),
  address: z.string().min(5, "Full address is required").max(500),
  deliveryTime: z.string().min(1, "Please select delivery time"),
  instructions: z.string().max(500).optional().or(z.literal(""))
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedPlan = searchParams.get("plan") || state.plan || "single";
  const items = state.items;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema)
  });

  const formValues = watch();

  if (items.length === 0) {
    return (
      <div className="text-center">
        <div className="mb-6 rounded-full bg-primary/10 p-6 w-fit mx-auto">
          <Phone className="size-10 text-primary" />
        </div>
        <h1 className="font-serif text-3xl font-semibold">Your cart is empty</h1>
        <p className="mt-3 text-muted max-w-sm mx-auto">Please select meals from our menu before proceeding to checkout.</p>
        <Link href="/#menu">
          <Button className="mt-8">Back to Menu</Button>
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = getDeliveryFee(formValues.area || "", selectedPlan);
  const planPrices: Record<string, number> = {
    single: subtotal,
    weekly: 1750,
    monthly: 6500,
    corporate: 0
  };
  const total = planPrices[selectedPlan] || subtotal;

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      startTransition(async () => {
        const orderData = {
          customer: { ...data, plan: selectedPlan },
          items,
          plan: selectedPlan,
          subtotal,
          deliveryFee,
          total
        };

        const result = await submitOrder(orderData);

        if (result.success) {
          dispatch({ type: "CLEAR_CART" });
          router.push(`/order/success?orderId=${result.orderId}`);
        } else {
          setError(result.error || "Failed to submit order. Please try again.");
        }
      });
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Checkout error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = generateWhatsAppOrderMessage(
    items,
    { ...formValues, plan: selectedPlan },
    subtotal,
    deliveryFee,
    total
  );

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Form Section */}
      <div className="md:col-span-2">
        <Link href="/#menu" className="flex items-center gap-2 text-primary mb-8 hover:opacity-75 transition">
          <ArrowLeft className="size-4" />
          <span className="text-sm font-semibold">Back to Menu</span>
        </Link>

        <h1 className="font-serif text-4xl font-semibold mb-2">Order Details</h1>
        <p className="text-muted mb-8">Fill in your delivery information to complete your order.</p>

        {error && (
          <div className="mb-6 rounded-[16px] bg-danger/10 border border-danger/20 p-4 text-sm text-danger font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <User className="size-5 text-primary" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Your full name"
                {...register("fullName")}
                error={errors.fullName?.message}
                required
              />
              <Input
                label="Phone Number"
                placeholder="+92 300 1234567"
                {...register("phone")}
                error={errors.phone?.message}
                required
              />
              <Input
                label="WhatsApp Number"
                placeholder="+92 300 1234567"
                {...register("whatsappNumber")}
                error={errors.whatsappNumber?.message}
                required
              />
              <Input
                label="Email (Optional)"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>
          </div>

          {/* Office Information */}
          <div>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Office Information
            </h2>
            <div className="space-y-4">
              <Input
                label="Company/Office Name"
                placeholder="Your company name"
                {...register("company")}
                error={errors.company?.message}
                required
              />
              <Input
                label="Delivery Area"
                placeholder="e.g., Johar Town, Gulberg"
                {...register("area")}
                error={errors.area?.message}
                required
              />
              <Textarea
                label="Full Office Address"
                placeholder="Building name, floor, room number, street"
                {...register("address")}
                error={errors.address?.message}
              />
            </div>
          </div>

          {/* Delivery Information */}
          <div>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              Delivery Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Preferred Delivery Time *</label>
                <select
                  {...register("deliveryTime")}
                  className="w-full px-4 h-12 rounded-2xl border border-border bg-card focus-ring transition"
                  required
                >
                  <option value="">Select a time</option>
                  <option value="12:00-12:30">12:00 PM - 12:30 PM</option>
                  <option value="12:30-1:00">12:30 PM - 1:00 PM</option>
                  <option value="1:00-1:30">1:00 PM - 1:30 PM</option>
                </select>
                {errors.deliveryTime && (
                  <p className="text-xs font-semibold text-danger mt-1">{errors.deliveryTime.message}</p>
                )}
              </div>
              <Textarea
                label="Delivery Instructions (Optional)"
                placeholder="e.g., 'Ring doorbell twice', 'Meet at reception', etc."
                {...register("instructions")}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="space-y-3 pt-6 border-t border-border">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isPending || isSubmitting}
            >
              {isPending || isSubmitting ? "Submitting..." : "Confirm Order"}
            </Button>
            <WhatsAppButton
              message={whatsappMessage}
              variant="inline"
              className="w-full"
            />
          </div>
        </form>
      </div>

      {/* Order Summary Sticky Sidebar */}
      <div className="md:col-span-1">
        <div className="sticky top-24 glass-card rounded-[28px] p-6 space-y-6">
          <h2 className="font-serif text-2xl font-semibold">Order Summary</h2>

          {/* Plan Badge */}
          <div className="rounded-[16px] bg-primary/10 p-4">
            <p className="text-xs text-primary font-semibold uppercase mb-1">Selected Plan</p>
            <p className="font-serif text-xl font-semibold text-foreground">
              {selectedPlan === "single"
                ? "Single Meals"
                : selectedPlan === "weekly"
                  ? "Weekly Office Plan"
                  : selectedPlan === "monthly"
                    ? "Monthly Subscription"
                    : "Corporate Request"}
            </p>
          </div>

          {/* Items List */}
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted">{item.day} × {item.quantity}</p>
                </div>
                <p className="font-semibold">Rs.{item.price * item.quantity}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold">Rs.{subtotal}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Delivery Fee</span>
                <span className="font-semibold">Rs.{deliveryFee}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-serif text-2xl font-semibold text-primary">Rs.{total}</span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="border-t border-border pt-4 space-y-2 text-xs text-muted">
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Freshly cooked daily</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Office delivery confirmed on WhatsApp</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Secure ordering platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
