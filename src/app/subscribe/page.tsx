import { MarketingNav } from "@/components/marketing/nav";
import { SubscribeForm } from "@/components/forms/subscribe-form";
import { Footer } from "@/components/marketing/landing-sections";

export const metadata = {
  title: "Subscribe",
  description: "Start your homemade office lunch subscription."
};

export default function SubscribePage() {
  return (
    <>
      <MarketingNav />
      <main className="container-gsd py-16 md:py-24">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="font-serif text-5xl font-semibold">Start your lunch plan</h1>
          <p className="mt-4 text-lg leading-8 text-muted">Enter your details and our team will confirm your office delivery availability.</p>
        </div>
        <SubscribeForm />
      </main>
      <Footer />
    </>
  );
}
