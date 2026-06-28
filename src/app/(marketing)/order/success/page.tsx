import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/landing-sections";
import { OrderSuccessContent } from "@/components/ordering/order-success-content";
import { Suspense } from "react";

export const metadata = {
  title: "Order Confirmed",
  description: "Your order has been successfully submitted. Our team will confirm it on WhatsApp."
};

export default function OrderSuccessPage() {
  return (
    <>
      <MarketingNav />
      <main className="container-gsd py-12 md:py-24 min-h-[60vh] flex flex-col items-center justify-center">
        <Suspense fallback={<div>Loading...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
