import { Card, SectionHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrencyPKR, whatsappUrl, cn } from "@/lib/utils";
import { plans, weeklyMenu } from "@/data/menu";
import { Building2, CheckCircle2, ChefHat, HeartHandshake, MessageCircle, PackageCheck, ShieldCheck, Utensils } from "lucide-react";
import { MenuDayTabs } from "@/components/marketing/menu-day-tabs";

const reasons = [
  { title: "Not fast food", text: "Balanced homemade meals that feel lighter during office hours.", icon: Utensils },
  { title: "Women-led home kitchens", text: "Support skilled home chefs while getting trusted ghar ka khana.", icon: HeartHandshake },
  { title: "Office-friendly delivery", text: "Daily lunch slots designed for teams, banks, startups, and call centers.", icon: PackageCheck },
  { title: "Simple subscription", text: "Choose weekly or monthly plans and remove daily lunch confusion.", icon: ShieldCheck }
];

const steps = ["Choose your plan", "Pick from 2 daily meals", "Freshly cooked by home chefs", "Delivered to your office"];

export function WhyChooseSection() {
  return (
    <section id="why" className="py-20 md:py-28">
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
              <h3 className="font-serif text-2xl font-semibold">{title}</h3>
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
    <section className="py-20 md:py-28">
      <div className="container-gsd">
        <SectionHeader eyebrow="How it works" title="From menu selection to lunch desk in four simple steps." />
        <div className="grid gap-5 md:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={step} className="relative">
              <div className="mb-8 font-serif text-5xl font-semibold text-accent">0{index + 1}</div>
              <h3 className="font-serif text-2xl font-semibold">{step}</h3>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StorySection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-gsd grid items-center gap-8 lg:grid-cols-2">
        <div className="glass-card rounded-[36px] p-8 md:p-12">
          <Badge>Ammi’s Kitchen to Office</Badge>
          <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight md:text-5xl">
            Bringing the care of home kitchens into busy office days.
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted">
            Across Pakistan, many homes prepare food with care, skill, and love every day. Ghar Se Daftar connects trusted home chefs, especially household women, with office professionals who want fresh, simple, and comforting meals during work.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-[32px] bg-primary p-8 text-white">
            <ChefHat className="mb-8 size-10" />
            <div className="font-serif text-4xl font-semibold">64+</div>
            <p className="mt-2 text-white/75">verified home chefs in onboarding pipeline</p>
          </div>
          <div className="rounded-[32px] bg-secondary p-8 text-white sm:mt-16">
            <Building2 className="mb-8 size-10" />
            <div className="font-serif text-4xl font-semibold">28</div>
            <p className="mt-2 text-white/75">corporate offices ready for team lunch plans</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WeeklyMenuSection() {
  return (
    <section id="menu" className="py-20 md:py-28">
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
    <section className="py-20 md:py-28">
      <div className="container-gsd rounded-[40px] bg-primary p-8 text-white md:p-14">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge className="border-white/20 bg-white/10 text-white">Meal details</Badge>
            <h2 className="mt-5 font-serif text-4xl font-semibold md:text-5xl">Every lunch is planned for a balanced office day.</h2>
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
    <section id="plans" className="py-20 md:py-28">
      <div className="container-gsd">
        <SectionHeader eyebrow="Subscription plans" title="Start small, then make homemade lunch your daily office routine." />
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.highlighted ? "border-2 border-primary bg-primary text-white scale-105 shadow-2xl shadow-primary/20" : "border border-border"}>
              {plan.highlighted ? <Badge className="mb-4 border-white/20 bg-white/10 text-white">Most popular</Badge> : null}
              <h3 className={cn("font-serif text-3xl font-semibold", plan.highlighted ? "text-white" : "text-foreground")}>{plan.name}</h3>
              <div className="mt-5 flex items-end gap-2">
                <span className={cn("font-serif text-5xl font-semibold", plan.highlighted ? "text-white" : "text-foreground")}>
                  {formatCurrencyPKR(plan.price).replace("PKR", "Rs.")}
                </span>
              </div>
              <p className={plan.highlighted ? "mt-2 text-white/75 font-medium" : "mt-2 text-muted font-medium"}>{plan.cadence}</p>
              <p className={plan.highlighted ? "mt-5 leading-7 text-white/80" : "mt-5 leading-7 text-muted"}>{plan.description}</p>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className={cn("flex items-center gap-3 text-sm font-semibold", plan.highlighted ? "text-white/90" : "text-foreground")}>
                    <CheckCircle2 className={cn("size-4", plan.highlighted ? "text-white" : "text-primary")} /> {feature}
                  </div>
                ))}
              </div>
              <ButtonLink href="/subscribe" variant={plan.highlighted ? "accent" : "primary"} className="mt-8 w-full">Choose Plan</ButtonLink>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CorporateSection() {
  return (
    <section id="corporate" className="py-20 md:py-28">
      <div className="container-gsd grid items-center gap-8 rounded-[40px] bg-secondary p-8 text-white md:p-14 lg:grid-cols-2">
        <div>
          <Badge className="border-white/20 bg-white/10 text-white">Corporate packages</Badge>
          <h2 className="mt-5 font-serif text-4xl font-semibold md:text-5xl">Lunch plans for teams, offices, call centers, and banks.</h2>
          <p className="mt-5 leading-8 text-white/75">Get bulk employee lunch management, weekly menu selection, dedicated delivery slots, and monthly billing.</p>
          <ButtonLink href="/corporate" variant="accent" className="mt-8">Request Corporate Package</ButtonLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {["10–25 employees", "25–50 employees", "50+ employees", "Monthly invoices"].map((item) => (
            <div key={item} className="rounded-3xl bg-white/10 p-6 font-serif text-2xl font-semibold">{item}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ChefShowcaseSection() {
  const chefs = [
    { name: "Chef Shazia", area: "Johar Town", specialty: "Daal, Sabzi, Chicken Salan" },
    { name: "Chef Noreen", area: "Gulberg", specialty: "Biryani, Pulao, Raita" },
    { name: "Chef Farah", area: "DHA", specialty: "Healthy roti meals" }
  ];
  return (
    <section className="py-20 md:py-28">
      <div className="container-gsd">
        <SectionHeader eyebrow="Home chefs" title="Verified home kitchens with real Pakistani food experience." />
        <div className="grid gap-5 md:grid-cols-3">
          {chefs.map((chef) => (
            <Card key={chef.name}>
              <div className="mb-5 grid aspect-square place-items-center rounded-[28px] bg-[radial-gradient(circle,#d4a373_0_16%,#f8f4ec_17%_40%,#355e3b_41%_44%,#fffaf2_45%)]" />
              <Badge>Verified Kitchen</Badge>
              <h3 className="mt-4 font-serif text-3xl font-semibold">{chef.name}</h3>
              <p className="mt-2 text-muted">{chef.area}, Lahore</p>
              <p className="mt-4 font-semibold text-secondary">Specialty: {chef.specialty}</p>
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
    <section className="py-20 md:py-28">
      <div className="container-gsd">
        <SectionHeader eyebrow="Testimonials" title="Built for the people who need reliable lunch every working day." />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map(([role, text]) => (
            <Card key={role}>
              <p className="font-serif text-2xl leading-9">“{text}”</p>
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
    ["Is this restaurant food?", "No. Ghar Se Daftar is a homemade meal subscription platform, not a fast-food or restaurant marketplace."],
    ["Can I choose my meal daily?", "Yes. The recommended model gives customers two curated options per day."],
    ["Can I pause my subscription?", "Yes. Pause/resume should be available from the customer dashboard with a cutoff time."],
    ["Do you support corporate teams?", "Yes. Corporate packages include team counts, delivery slots, and monthly billing."],
    ["How are chefs verified?", "Each kitchen should pass identity, hygiene, sample meal, packaging, and consistency checks before going live."]
  ];
  return (
    <section className="py-20 md:py-28">
      <div className="container-gsd">
        <SectionHeader eyebrow="FAQ" title="Questions customers will ask before they trust a new lunch habit." />
        <div className="mx-auto max-w-3xl divide-y divide-border rounded-[32px] border border-border bg-white/70 px-6">
          {faqs.map(([q, a]) => (
            <div key={q} className="py-6">
              <h3 className="font-serif text-2xl font-semibold">{q}</h3>
              <p className="mt-2 leading-7 text-muted">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhatsAppCTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-gsd rounded-[40px] bg-primary p-8 text-center text-white md:p-16">
        <MessageCircle className="mx-auto mb-6 size-12" />
        <h2 className="font-serif text-4xl font-semibold md:text-6xl">Want to start from tomorrow’s lunch?</h2>
        <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/75">Order on WhatsApp and our team will confirm your area, plan, and this week’s menu.</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={whatsappUrl("Salam, I want to subscribe to Ghar Se Daftar. Please share this week’s menu and delivery availability for my office.")} variant="accent">Order on WhatsApp</ButtonLink>
          <ButtonLink href="#menu" variant="secondary">View Weekly Menu</ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container-gsd grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="font-serif text-2xl font-semibold">Ghar Se Daftar</div>
          <p className="mt-3 max-w-sm text-muted">Ghar Ka Khana, Ab Daftar Tak. Premium homemade meal subscriptions for office professionals.</p>
        </div>
        {[
          ["Company", "About", "Home Chefs", "Corporate Plans", "Contact"],
          ["Customers", "Weekly Menu", "Subscription Plans", "FAQ", "WhatsApp Order"],
          ["Legal", "Privacy Policy", "Terms", "Refund Policy", "Food Safety Policy"]
        ].map(([title, ...items]) => (
          <div key={title}>
            <h3 className="font-bold text-secondary">{title}</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              {items.map((item) => <div key={item}>{item}</div>)}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
