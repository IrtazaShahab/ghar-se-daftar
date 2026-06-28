import { MarketingNav } from "@/components/marketing/nav";
import { Footer, WeeklyMenuSection, WhatsAppCTASection } from "@/components/marketing/landing-sections";

export const metadata = {
  title: "Weekly Menu",
  description: "View this week’s homemade Pakistani office lunch menu."
};

export default function WeeklyMenuPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <WeeklyMenuSection />
        <WhatsAppCTASection />
      </main>
      <Footer />
    </>
  );
}
