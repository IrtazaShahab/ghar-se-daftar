import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Sparkles, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FoodImage } from "@/components/ui/food-image";
import { foodImages } from "@/data/food-images";

const badges = ["Freshly cooked daily", "Women-led kitchens", "Office subscriptions", "WhatsApp ordering"];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(33,79,50,0.14),transparent_34rem)]" />
      <div className="container-gsd relative grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="section-reveal">
          <Badge className="mb-6 gap-2 border-primary/15 bg-white/70 text-primary"><Sparkles className="size-3.5" /> Women-led homemade lunch platform</Badge>
          <h1 className="max-w-4xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] text-foreground md:text-6xl">
            Ghar ka khana for office days, cooked by trusted home chefs.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted md:text-lg">
            Fresh Pakistani lunches from verified women-led kitchens, packed neatly and delivered to your daftar. Warm, reliable, and lighter than the daily fast-food routine.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/subscribe" className="gap-2">Start Weekly Plan <ArrowRight className="size-4" /></ButtonLink>
            <ButtonLink href="#menu" variant="secondary">View Weekly Menu</ButtonLink>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <div key={badge} className="flex items-center gap-2 rounded-full border border-border bg-white/60 px-4 py-3 text-sm font-bold text-primary/80">
                <CheckCircle2 className="size-4 text-primary" /> <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-reveal relative [animation-delay:120ms]">
          <div className="relative overflow-hidden rounded-[34px] bg-primary p-4 text-white shadow-2xl shadow-primary/20 md:rounded-[42px] md:p-5">
            <div className="absolute left-6 top-6 z-10 rounded-full border border-white/15 bg-white/12 px-4 py-2 text-sm font-bold backdrop-blur">
              Lahore lunch slots open
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_0.72fr]">
              <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-white/10">
                <FoodImage
                  src={foodImages.heroSpread}
                  alt="Assorted homemade Pakistani lunch dishes on a wooden table"
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-white/20 bg-white/90 text-primary">Today’s Lunch</Badge>
                    <Badge className="border-white/20 bg-white/15 text-white"><Clock className="size-3.5" /> 12:45 PM</Badge>
                  </div>
                  <h2 className="mt-4 max-w-sm text-2xl font-extrabold tracking-[-0.02em] text-white md:text-3xl">Chicken Karahi, roti, salad and raita</h2>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[28px] bg-card p-4 text-foreground">
                  <div className="relative aspect-square overflow-hidden rounded-[22px] bg-white">
                    <FoodImage src={foodImages.chickenKarahi} alt="Chicken Karahi with roti" />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-extrabold tracking-[-0.02em]">Chicken Karahi</h3>
                    <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-white">Rs.350</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">2 Roti + Salad</p>
                </div>
                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5">
                  <ShieldCheck className="mb-4 size-7 text-accent" />
                  <div className="text-sm text-white/70">Verified Kitchen</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-[-0.02em]">Chef Shazia</div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-accent"><Star className="size-4 fill-current" /> 4.9 kitchen rating</div>
                </div>
                <div className="rounded-[28px] bg-white p-5 text-foreground">
                  <div className="text-sm font-bold text-muted">Weekly Plan</div>
                  <div className="mt-1 text-3xl font-extrabold tracking-[-0.03em]">Rs.1,750</div>
                  <div className="mt-1 text-sm text-muted">5 office lunches</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
