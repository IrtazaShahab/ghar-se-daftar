import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/landing-sections";
import { CorporateOrderForm } from "@/components/forms/corporate-order-form";

export const metadata = {
  title: "Corporate Order Request",
  description: "Request a homemade lunch package for your office team."
};

export default function CorporateOrderPage() {
  return (
    <>
      <MarketingNav />
      <main className="container-gsd py-16 md:py-24">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Request a corporate lunch plan</h1>
          <p className="mt-4 text-base leading-8 text-muted md:text-lg">Tell us your team size and area. We will prepare a custom plan and tasting option.</p>
        </div>
        <CorporateOrderForm />
      </main>
      <Footer />
    </>
  );
}
