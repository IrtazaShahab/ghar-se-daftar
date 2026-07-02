"use client";

import { useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { generateOrderConfirmationMessage } from "@/lib/order";
import { Check, CheckCircle2, Clock, Phone, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

export function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "GSD-ORDER-XXXX";
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl">
      {/* Success Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            <div className="relative rounded-full bg-primary p-6 text-white">
              <Check className="size-12 stroke-[3]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Message */}
      <h1 className="font-serif text-4xl md:text-5xl font-semibold text-center text-balance mb-4">
        Order Submitted Successfully!
      </h1>

      <p className="text-center text-muted text-lg max-w-xl mx-auto mb-8">
        Your delicious homemade meals are on the way. Our team will confirm your order on WhatsApp within {countdown} minutes.
      </p>

      {/* Order Reference */}
      <div className="glass-card rounded-[28px] p-8 mb-8 text-center">
        <p className="text-muted text-sm font-semibold uppercase mb-2">Order Reference</p>
        <p className="font-serif text-3xl font-semibold text-primary mb-4">{orderId}</p>
        <p className="text-sm text-muted">
          Share this number when you contact us on WhatsApp
        </p>
      </div>

      {/* Next Steps */}
      <div className="space-y-4 mb-8">
        <h2 className="font-serif text-2xl font-semibold">What happens next?</h2>

        <div className="space-y-3">
          {[
            {
              step: 1,
              title: "Order Confirmation",
              description: "Our team will confirm your order availability on WhatsApp",
              icon: Phone
            },
            {
              step: 2,
              title: "Fresh Preparation",
              description: "Your meals will be prepared fresh in our verified home kitchen",
              icon: Clock
            },
            {
              step: 3,
              title: "Office Delivery",
              description: "Freshly packed meals delivered to your office at your preferred time",
              icon: MapPin
            }
          ].map(({ step, title, description, icon: Icon }) => (
            <div
              key={step}
              className="glass-card rounded-[20px] p-4 flex gap-4"
            >
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="flex items-center justify-center size-10 rounded-full bg-primary/10">
                  <span className="font-semibold text-primary">{step}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-border pt-8 mb-8">
        <h2 className="font-serif text-2xl font-semibold mb-4">Why trust Ghar Se Daftar?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: CheckCircle2, label: "Freshly Cooked Daily" },
            { icon: Check, label: "Verified Home Kitchens" },
            { icon: Check, label: "Safe Office Delivery" },
            { icon: Check, label: "WhatsApp Support 24/7" }
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="size-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <WhatsAppButton
          message={generateOrderConfirmationMessage(orderId)}
          variant="inline"
          className="w-full"
        />
        <ButtonLink href="/#menu" variant="secondary" className="w-full">
          Browse More Meals
        </ButtonLink>
      </div>

      {/* Additional Info */}
      <div className="mt-12 p-6 rounded-[20px] bg-primary/5 border border-primary/10">
        <p className="text-sm text-muted">
          <strong className="text-foreground">Need help?</strong> Contact us on WhatsApp at the number in our footer. We're here to ensure your office lunch experience is perfect.
        </p>
      </div>
    </div>
  );
}
