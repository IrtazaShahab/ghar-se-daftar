import { Card, SectionHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrencyPKR, whatsappUrl, cn } from "@/lib/utils";
import { plans, weeklyMenu } from "@/data/menu";
import { foodImages } from "@/data/food-images";
import { Award, Building2, CheckCircle2, ChefHat, HeartHandshake, MapPin, MessageCircle, PackageCheck, ShieldCheck, Sparkles, Star, Utensils } from "lucide-react";
import { MenuDayTabs } from "@/components/marketing/menu-day-tabs";
import { FoodImage } from "@/components/ui/food-image";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import Link from "next/link";
import { generateSubscriptionInquiryMessage } from "@/lib/order";

const reasons = [
  { title: "Not fast food", text: "Balanced homemade meals that feel lighter during office hours.", icon: Utensils },
  { title: "Women-led home kitchens", text: "Support skilled home chefs while getting trusted ghar ka khana.", icon: HeartHandshake },
  { title: "Office-friendly delivery", text: "Daily lunch slots designed for teams, banks, startups, and call centers.", icon: PackageCheck },
  { title: "Simple subscription", text: "Choose weekly or monthly plans and remove daily lunch confusion.", icon: ShieldCheck }
];

const steps = ["Choose your plan", "Pick from 2 daily meals", "Freshly cooked by home chefs", "Delivered to your office"];

export function WhyChooseSection() {
  return (
    <section id="why" className="py-16 md:py-24">
      <div className="container-gsd">
        <SectionHeader
          eyebrow="Why choose us"
          title="A better office lunch habit, built around trust."
          description="Ghar Se Daftar is designed for professionals who want homemade Pakistani food without daily ordering stress."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ title, text, icon: Icon }) => (
            <Card key={title}>
              <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-6" /></div>
              <h3 className="text-xl font-extrabold tracking-[-0.02em]">{title}</h3>
              <p className="mt-3 leading-7 text-muted">{text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-gsd">
        <SectionHeader eyebrow="How it works" title="From menu selection to lunch desk in four simple steps." />
        <div className="grid gap-5 md:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={step} className="relative">
              <div className="mb-8 text-5xl font-extrabold tracking-[-0.04em] text-accent">0{index + 1}</div>
              <h3 className="text-xl font-extrabold tracking-[-0.02em]">{step}</h3>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StorySection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-gsd grid items-center gap-8 lg:grid-cols-2">
        <div className="glass-card rounded-[36px] p-8 md:p-12">
          <Badge>Ammi’s Kitchen to Office</Badge>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
            Bringing the care of home kitchens into busy office days.
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted">
            Across Pakistan, many homes prepare food with care, skill, and love every day. Ghar Se Daftar connects trusted home chefs, especially household women, with office professionals who want fresh, simple, and comforting meals during work.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="relative min-h-80 overflow-hidden rounded-[32px] bg-card sm:col-span-2">
            <FoodImage
              src={foodImages.homeKitchenSpread}
              alt="A home kitchen spread with Pakistani curries, rice, and roti"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="rounded-[32px] bg-primary p-8 text-white">
            <ChefHat className="mb-8 size-10" />
            <div className="text-4xl font-extrabold tracking-[-0.03em]">64+</div>
            <p className="mt-2 text-white/75">verified home chefs in onboarding pipeline</p>
          </div>
          <div className="rounded-[32px] bg-secondary p-8 text-white sm:mt-16">
            <Building2 className="mb-8 size-10" />
            <div className="text-4xl font-extrabold tracking-[-0.03em]">28</div>
            <p className="mt-2 text-white/75">corporate offices ready for team lunch plans</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WeeklyMenuSection() {
  return (
    <section id="menu" className="py-16 md:py-24">
      <div className="container-gsd">
        <SectionHeader
          eyebrow="Weekly menu"
          title="Two curated choices every day. Simple for customers, manageable for kitchens."
          description="Customers choose from two meals daily. Saturday is an optional add-on for teams that work weekends."
        />
        <MenuDayTabs />
      </div>
    </section>
  );
}

export function MealDetailsSection() {
  const details = ["Main dish", "Roti or rice", "Salad", "Raita/chutney when applicable", "Hygienic packaging", "Office delivery slot"];
  return (
    <section className="py-16 md:py-24">
      <div className="container-gsd rounded-[36px] bg-primary p-8 text-white shadow-2xl shadow-primary/15 md:p-14">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge className="border-white/20 bg-white/10 text-white">Meal details</Badge>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">Every lunch is planned for a balanced office day.</h2>
            <p className="mt-5 leading-8 text-white/75">Meals are homemade and may vary slightly based on seasonal ingredients and kitchen availability.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {details.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-sm font-semibold">
                <CheckCircle2 className="size-5" /> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PlansSection() {
  return (
    <section id="plans" className="py-16 md:py-24">
      <div className="container-gsd">
        <SectionHeader eyebrow="Subscription plans" title="Start small, then make homemade lunch your daily office routine." />
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative flex min-h-[520px] flex-col overflow-hidden p-7 md:p-8",
                plan.highlighted
                  ? "scale-[1.02] border-0 text-white shadow-2xl shadow-primary/20"
                  : "border border-border"
              )}
              style={plan.highlighted ? { background: "linear-gradient(145deg, #355e3b 0%, #294a31 52%, #8b5a2b 130%)" } : undefined}
            >
              {plan.highlighted ? (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_25%_20%,rgba(212,163,115,0.42),transparent_32rem)]" />
                  <div className="relative mb-6 flex items-center justify-between gap-3">
                    <Badge className="border-white/20 bg-white/10 text-white shadow-sm">Most popular</Badge>
                    <span className="grid size-11 place-items-center rounded-full bg-white/10 text-accent ring-1 ring-white/15">
                      <Sparkles className="size-5" />
                    </span>
                  </div>
                </>
              ) : (
                <span className="mb-6 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <Utensils className="size-5" />
                </span>
              )}
              <h3 className={cn("relative text-2xl font-extrabold tracking-[-0.03em] md:text-3xl", plan.highlighted ? "text-white" : "text-foreground")}>{plan.name}</h3>
              <div className="relative mt-5 flex items-end gap-2">
                <span className={cn("text-4xl font-extrabold tracking-[-0.04em] md:text-5xl", plan.highlighted ? "text-white" : "text-foreground")}>
                  {formatCurrencyPKR(plan.price).replace("PKR", "Rs.")}
                </span>
              </div>
              <p className={plan.highlighted ? "relative mt-2 font-medium text-white/75" : "mt-2 font-medium text-muted"}>{plan.cadence}</p>
              <p className={plan.highlighted ? "relative mt-5 leading-7 text-white/80" : "mt-5 leading-7 text-muted"}>{plan.description}</p>
              <div className={cn("relative mt-7 space-y-3 rounded-[22px] p-4", plan.highlighted ? "bg-white/10 ring-1 ring-white/15" : "bg-white/45")}>
                {plan.features.map((feature) => (
                  <div key={feature} className={cn("flex items-center gap-3 text-sm font-semibold", plan.highlighted ? "text-white/90" : "text-foreground")}>
                    <CheckCircle2 className={cn("size-4", plan.highlighted ? "text-white" : "text-primary")} /> {feature}
                  </div>
                ))}
              </div>
              <ButtonLink href="/subscribe" variant={plan.highlighted ? "accent" : "primary"} className="relative mt-auto w-full shadow-lg shadow-black/10">Choose Plan</ButtonLink>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CorporateSection() {
  return (
    <section id="corporate" className="py-16 md:py-24">
      <div className="container-gsd grid items-center gap-8 rounded-[36px] bg-secondary p-8 text-white shadow-2xl shadow-secondary/10 md:p-14 lg:grid-cols-2">
        <div>
          <Badge className="border-white/20 bg-white/10 text-white">Corporate packages</Badge>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">Lunch plans for teams, offices, call centers, and banks.</h2>
          <p className="mt-5 leading-8 text-white/75">Get bulk employee lunch management, weekly menu selection, dedicated delivery slots, and monthly billing.</p>
          <ButtonLink href="/corporate" variant="accent" className="mt-8">Request Corporate Package</ButtonLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {["10–25 employees", "25–50 employees", "50+ employees", "Monthly invoices"].map((item) => (
            <div key={item} className="rounded-3xl bg-white/10 p-6 text-2xl font-extrabold tracking-[-0.02em]">{item}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ChefShowcaseSection() {
  const chefs = [
    { name: "Chef Shazia", area: "Johar Town", specialty: "Daal, Sabzi, Chicken Salan", imageSrc: "/images/chefs/chef-shazia.png", rating: "4.9" },
    { name: "Chef Noreen", area: "Gulberg", specialty: "Biryani, Pulao, Raita", imageSrc: "/images/chefs/chef-noreen.png", rating: "4.8" },
    { name: "Chef Nadia", area: "DHA", specialty: "Healthy roti meals", imageSrc: "/images/chefs/chef-farah.png", rating: "4.9" }
  ];
  return (
    <section id="chefs" className="py-16 md:py-24">
      <div className="container-gsd">
        <SectionHeader eyebrow="Home chefs" title="Verified home kitchens with real Pakistani food experience." />
        <div className="grid gap-5 md:grid-cols-3">
          {chefs.map((chef) => (
            <Card key={chef.name} className="overflow-hidden p-0">
              <div className="relative h-64 overflow-hidden bg-card">
                <FoodImage
                  src={chef.imageSrc}
                  alt={`${chef.name}, verified female home chef in Lahore`}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-foreground/55 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/92 px-3 py-2 text-sm font-bold text-primary shadow-lg">
                  <Award className="size-4" />
                  Verified Kitchen
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-[-0.03em]">{chef.name}</h3>
                    <p className="mt-2 flex items-center gap-2 text-muted">
                      <MapPin className="size-4 text-secondary" />
                      {chef.area}, Lahore
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-accent/18 px-3 py-1.5 text-sm font-bold text-secondary">
                    <Star className="size-4 fill-current" />
                    {chef.rating}
                  </div>
                </div>
                <div className="mt-5 rounded-[20px] border border-border bg-white/55 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Specialty</p>
                  <p className="mt-2 font-semibold text-foreground">{chef.specialty}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const testimonials = [
    ["Software Engineer", "I used to order fast food almost daily. Now I get proper ghar ka khana without thinking every morning."],
    ["Bank Employee", "The monthly plan is convenient, and the food feels lighter than restaurant meals."],
    ["Startup Team Lead", "We started with 8 people and moved to a team lunch plan within two weeks."]
  ];
  return (
    <section className="py-16 md:py-24">
      <div className="container-gsd">
        <SectionHeader eyebrow="Testimonials" title="Built for the people who need reliable lunch every working day." />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map(([role, text]) => (
            <Card key={role}>
              <p className="text-xl font-bold leading-8 tracking-[-0.02em]">“{text}”</p>
              <p className="mt-6 text-sm font-bold text-secondary">{role}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  const faqs = [
    { question: "Is this restaurant food?", answer: "No. Ghar Se Daftar is a homemade meal subscription platform, not a fast-food or restaurant marketplace." },
    { question: "Can I choose my meal daily?", answer: "Yes. The recommended model gives customers two curated options per day." },
    { question: "Can I pause my subscription?", answer: "Yes. Pause/resume should be available from the customer dashboard with a cutoff time." },
    { question: "Do you support corporate teams?", answer: "Yes. Corporate packages include team counts, delivery slots, and monthly billing." },
    { question: "How are chefs verified?", answer: "Each kitchen should pass identity, hygiene, sample meal, packaging, and consistency checks before going live." }
  ];
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container-gsd">
        <SectionHeader eyebrow="FAQ" title="Questions customers will ask before they trust a new lunch habit." />
        <FAQAccordion items={faqs} />
      </div>
    </section>
  );
}

export function WhatsAppCTASection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-gsd overflow-hidden rounded-[36px] bg-primary text-white shadow-2xl shadow-primary/15">
        <div className="grid items-center gap-8 p-8 md:p-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <MessageCircle className="mb-6 size-12" />
            <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.04em] md:text-5xl">Want to start from tomorrow’s lunch?</h2>
            <p className="mt-5 max-w-2xl leading-8 text-white/75">Order on WhatsApp and our team will confirm your area, plan, and this week’s menu.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={whatsappUrl(generateSubscriptionInquiryMessage())} variant="accent">Order on WhatsApp</ButtonLink>
              <ButtonLink href="#menu" variant="secondary">View Weekly Menu</ButtonLink>
            </div>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-[28px] bg-white/10">
            <FoodImage
              src={foodImages.chapliKebab}
              alt="Chapli kebab platter with roti and chutney"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const linkGroups = [
    { title: "Company", links: [{ label: "About", href: "/#why" }, { label: "Home Chefs", href: "/#chefs" }, { label: "Corporate Plans", href: "/corporate" }, { label: "Contact", href: "/corporate-order" }] },
    { title: "Customers", links: [{ label: "Weekly Menu", href: "/menu" }, { label: "Subscription Plans", href: "/#plans" }, { label: "FAQ", href: "/#faq" }, { label: "WhatsApp Order", href: "/subscribe" }] },
    { title: "Legal", links: [{ label: "Privacy Policy", href: "/" }, { label: "Terms", href: "/" }, { label: "Refund Policy", href: "/" }, { label: "Food Safety Policy", href: "/" }] }
  ];

  return (
    <footer className="bg-primary px-4 py-6 text-white">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[34px] border border-white/10 bg-[#153b25]">
        <div className="grid gap-10 p-7 md:grid-cols-[1.35fr_1fr] md:p-10 lg:p-12">
          <div>
            <div className="text-2xl font-extrabold tracking-[-0.03em]">Ghar Se Daftar</div>
            <p className="mt-4 max-w-md leading-7 text-white/70">Ghar Ka Khana, Ab Daftar Tak. A premium homemade meal subscription platform connecting office professionals with trusted women-led kitchens.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/subscribe" variant="accent">Start Weekly Plan</ButtonLink>
              <ButtonLink href="/corporate" variant="secondary">Corporate Lunch</ButtonLink>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[24px] bg-white/10 p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-accent">Contact</h3>
              <div className="mt-4 space-y-2 text-sm text-white/72">
                <p>Lahore, Pakistan</p>
                <p>WhatsApp ordering available</p>
                <p>support@gharsedaftar.pk</p>
              </div>
            </div>
            <div className="rounded-[24px] bg-white/10 p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-accent">Lunch Hours</h3>
              <div className="mt-4 space-y-2 text-sm text-white/72">
                <p>Mon - Fri: 12 PM - 2 PM</p>
                <p>Saturday: team add-on</p>
                <p>Weekly menu updates</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-8 border-t border-white/10 p-7 md:grid-cols-4 md:p-10 lg:p-12">
          <div>
            <p className="text-sm text-white/55">Inspired by home kitchens. Built for office routines.</p>
          </div>
          {linkGroups.map(({ title, links }) => (
            <div key={title}>
              <h3 className="font-extrabold text-white">{title}</h3>
              <div className="mt-4 space-y-3 text-sm text-white/58">
                {links.map((item) => (
                  <Link key={item.label} href={item.href} className="block transition hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 px-7 py-5 text-xs font-semibold text-white/45 md:flex-row md:items-center md:justify-between md:px-10 lg:px-12">
          <span>©2026 Ghar Se Daftar. All rights reserved.</span>
          <span>Fresh meals. Verified kitchens. Office delivery.</span>
        </div>
      </div>
    </footer>
  );
}
