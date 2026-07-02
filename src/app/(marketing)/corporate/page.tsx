import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/landing-sections";
import { Card, SectionHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Corporate Lunch Packages",
  description: "Homemade Pakistani lunch subscriptions for teams, offices, banks, startups, and call centers."
};

export default function CorporatePage() {
  return (
    <>
      <MarketingNav />
      <main className="py-16 md:py-24">
        <div className="container-gsd">
          <SectionHeader
            eyebrow="Corporate packages"
            title="Reliable homemade lunch plans for offices and teams."
            description="Request a corporate trial, assign employee meal counts, and manage monthly billing from one dashboard."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {["Team meal counts", "Dedicated delivery slots", "Monthly invoices"].map((item) => (
              <Card key={item}><h3 className="text-2xl font-extrabold tracking-[-0.03em]">{item}</h3></Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/corporate-order">Start Corporate Request</ButtonLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
