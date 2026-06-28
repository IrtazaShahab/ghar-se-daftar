import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/landing-sections";
import { CheckoutForm } from "@/components/ordering/checkout-form";
import { Suspense } from "react";

export const metadata = {
  title: "Checkout",
  description: "Complete your order for homemade Pakistani office lunch delivery."
};

export default function CheckoutPage() {
  return (
    <>
      <MarketingNav />
      <main className="container-gsd py-12 md:py-20">
        <Suspense fallback={<div className="py-20 text-center">Loading checkout...</div>}>
          <CheckoutForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
