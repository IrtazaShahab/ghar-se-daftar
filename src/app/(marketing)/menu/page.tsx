import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/landing-sections";
import { Card, SectionHeader } from "@/components/ui/card";
import { MenuDayTabs } from "@/components/marketing/menu-day-tabs";

export const metadata = {
  title: "Weekly Menu",
  description: "View our weekly homemade Pakistani office lunch menu. Two curated options every day."
};

export default function MenuPage() {
  return (
    <>
      <MarketingNav />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container-gsd">
            <SectionHeader
              eyebrow="This week's menu"
              title="Two fresh meal options every working day."
              description="From Monday to Saturday, choose between two curated meals prepared by verified home chefs. Saturday is optional for teams that work weekends."
            />
          </div>
        </section>

        {/* Menu Section */}
        <section className="py-16 md:py-20">
          <div className="container-gsd">
            <MenuDayTabs />
          </div>
        </section>

        {/* Why Our Menu Section */}
        <section className="py-16 md:py-20 bg-white/50">
          <div className="container-gsd">
            <SectionHeader eyebrow="Why choose us" title="Our menu is designed for office professionals." />
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                {
                  title: "Fresh Daily",
                  description:
                    "Every meal is cooked fresh in the morning and delivered to your desk at your preferred time."
                },
                {
                  title: "Light & Balanced",
                  description:
                    "Unlike restaurant food, our meals are light, balanced, and designed for productive work afternoons."
                },
                {
                  title: "Trusted Kitchens",
                  description:
                    "All meals are prepared in verified home kitchens by skilled, experienced cooks using quality ingredients."
                }
              ].map((item) => (
                <Card key={item.title}>
                  <h3 className="font-serif text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-muted">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
