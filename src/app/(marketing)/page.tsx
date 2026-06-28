import dynamic from "next/dynamic";
import { MarketingNav } from "@/components/marketing/nav";
import { HeroSection } from "@/components/marketing/hero";
import { Footer, HowItWorksSection, WhyChooseSection } from "@/components/marketing/landing-sections";

// Dynamically import below-the-fold sections for better performance
const StorySection = dynamic(() => import("@/components/marketing/landing-sections").then(mod => ({ default: mod.StorySection })), {
  loading: () => <div className="min-h-96" />,
  ssr: true
});

const WeeklyMenuSection = dynamic(() => import("@/components/marketing/landing-sections").then(mod => ({ default: mod.WeeklyMenuSection })), {
  loading: () => <div className="min-h-96" />,
  ssr: true
});

const MealDetailsSection = dynamic(() => import("@/components/marketing/landing-sections").then(mod => ({ default: mod.MealDetailsSection })), {
  loading: () => <div className="min-h-96" />,
  ssr: true
});

const PlansSection = dynamic(() => import("@/components/marketing/landing-sections").then(mod => ({ default: mod.PlansSection })), {
  loading: () => <div className="min-h-96" />,
  ssr: true
});

const CorporateSection = dynamic(() => import("@/components/marketing/landing-sections").then(mod => ({ default: mod.CorporateSection })), {
  loading: () => <div className="min-h-96" />,
  ssr: true
});

const ChefShowcaseSection = dynamic(() => import("@/components/marketing/landing-sections").then(mod => ({ default: mod.ChefShowcaseSection })), {
  loading: () => <div className="min-h-96" />,
  ssr: true
});

const TestimonialsSection = dynamic(() => import("@/components/marketing/landing-sections").then(mod => ({ default: mod.TestimonialsSection })), {
  loading: () => <div className="min-h-96" />,
  ssr: true
});

const FAQSection = dynamic(() => import("@/components/marketing/landing-sections").then(mod => ({ default: mod.FAQSection })), {
  loading: () => <div className="min-h-96" />,
  ssr: true
});

const WhatsAppCTASection = dynamic(() => import("@/components/marketing/landing-sections").then(mod => ({ default: mod.WhatsAppCTASection })), {
  loading: () => <div className="min-h-96" />,
  ssr: true
});

export const metadata = {
  title: "Ghar Se Daftar",
  description: "Premium homemade Pakistani office lunch subscriptions. Fresh meals delivered daily."
};

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        {/* Critical above-the-fold */}
        <HeroSection />
        <WhyChooseSection />
        <HowItWorksSection />

        {/* Below-the-fold: dynamically loaded */}
        <StorySection />
        <WeeklyMenuSection />
        <MealDetailsSection />
        <PlansSection />
        <CorporateSection />
        <ChefShowcaseSection />
        <TestimonialsSection />
        <FAQSection />
        <WhatsAppCTASection />
      </main>
      <Footer />
    </>
  );
}
