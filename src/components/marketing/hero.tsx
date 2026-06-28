import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FoodImage } from "@/components/ui/food-image";

const badges = ["Freshly cooked daily", "Women-led kitchens", "Office subscriptions", "WhatsApp ordering"];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="container-gsd grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Badge className="mb-6 gap-2"><Sparkles className="size-3.5" /> Premium homemade meal subscription</Badge>
          <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.03] text-balance md:text-7xl">
            Homemade Pakistani lunch, delivered fresh to your office.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted md:text-xl">
            Subscribe to healthy, ghar ka khana cooked by trusted home chefs and delivered daily to your daftar. No fast-food heaviness. No daily lunch stress.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/subscribe" className="gap-2">Start Weekly Plan <ArrowRight className="size-4" /></ButtonLink>
            <ButtonLink href="#menu" variant="secondary">View This Week’s Menu</ButtonLink>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-sm font-semibold text-muted">
                <CheckCircle2 className="size-4 text-primary" /> {badge}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[40px] bg-accent/20 blur-3xl" />
          <div className="glass-card relative overflow-hidden rounded-[36px] p-5">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#fffaf2,#f2e4d0)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <Badge>Today’s Lunch</Badge>
                <div className="flex items-center gap-2 text-sm font-bold text-primary"><Clock className="size-4" /> 12:45 PM</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] bg-white p-5 shadow-xl shadow-black/5 overflow-hidden">
                  <div className="aspect-square rounded-[20px] bg-[radial-gradient(circle,#d4a373_0_14%,#f8f4ec_15%_34%,#8b5a2b_35%_38%,#355e3b_39%_43%,#fffaf2_44%)] relative overflow-hidden">
                    <FoodImage src="/images/food/chicken-achari.jpg" alt="Chicken Achari" />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl font-semibold">Chicken Achari</h3>
                  <p className="mt-1 text-sm text-muted">2 Roti + Salad</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-[24px] bg-primary p-5 text-white">
                    <ShieldCheck className="mb-4 size-7" />
                    <div className="text-sm opacity-80">Verified Kitchen</div>
                    <div className="mt-1 font-serif text-2xl font-semibold">Chef Shazia</div>
                  </div>
                  <div className="rounded-[24px] bg-white p-5 shadow-xl shadow-black/5">
                    <div className="text-sm font-semibold text-muted">Weekly Plan</div>
                    <div className="mt-1 font-serif text-3xl font-semibold">Rs.1,750</div>
                    <div className="mt-1 text-sm text-muted">5 office lunches</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
