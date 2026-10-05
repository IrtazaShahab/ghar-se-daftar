import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/landing-sections";
import { CheckoutForm } from "@/components/ordering/checkout-form";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-user";
import { homePathForRole } from "@/lib/auth/guards";
import { LogIn } from "lucide-react";

export const metadata = {
  title: "Checkout",
  description: "Complete your order for homemade Pakistani office lunch delivery."
};

export const dynamic = "force-dynamic";

function Notice({ title, description, action }: { title: string; description: string; action: { href: string; label: string } }) {
  return (
    <div className="glass-card mx-auto max-w-md rounded-[28px] p-8 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10">
        <LogIn className="size-6 text-primary" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-serif text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-muted">{description}</p>
      <ButtonLink href={action.href} className="mt-6 w-full">{action.label}</ButtonLink>
    </div>
  );
}

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  let content: React.ReactNode;
  if (!user) {
    content = (
      <Notice
        title="Log in to check out"
        description="Your cart is saved. Log in or create an account to place your order and track it."
        action={{ href: "/login?next=/checkout", label: "Log in to continue" }}
      />
    );
  } else if (user.role !== "CUSTOMER") {
    content = (
      <Notice
        title="Customer checkout only"
        description="You're signed in with a staff account. Use a customer account to place orders."
        action={{ href: homePathForRole(user.role), label: "Go to your dashboard" }}
      />
    );
  } else {
    const address = user.addresses[0];
    content = (
      <CheckoutForm
        defaults={{
          fullName: user.fullName,
          email: user.email ?? "",
          phone: user.profile?.phone ?? user.phone ?? "",
          whatsappNumber: user.profile?.whatsappNumber ?? "",
          company: user.profile?.companyName ?? "",
          area: user.profile?.deliveryArea ?? address?.area ?? "",
          address: user.profile?.officeAddress ?? address?.address ?? "",
          instructions: user.profile?.deliveryInstructions ?? ""
        }}
      />
    );
  }

  return (
    <>
      <MarketingNav />
      <main className="container-gsd py-12 md:py-20">{content}</main>
      <Footer />
    </>
  );
}
