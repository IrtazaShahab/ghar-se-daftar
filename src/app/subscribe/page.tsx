import { MarketingNav } from "@/components/marketing/nav";
import { SubscribeForm } from "@/components/forms/subscribe-form";
import { Footer } from "@/components/marketing/landing-sections";
import { getCurrentUser } from "@/lib/auth/get-user";
import { redirectOperationalStaff } from "@/lib/auth/guards";

export const metadata = {
    title: "Subscribe",
    description: "Start your homemade office lunch subscription."
};

export const dynamic = "force-dynamic";

/** Customer plan sign-up; chef and rider accounts are sent to their portal. */
export default async function SubscribePage() {
    redirectOperationalStaff(await getCurrentUser());

    return (
        <>
            <MarketingNav />
            <main className="container-gsd py-16 md:py-24">
                <div className="mx-auto mb-10 max-w-2xl text-center">
                    <h1 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Start your lunch plan</h1>
                    <p className="mt-4 text-base leading-8 text-muted md:text-lg">Enter your details and our team will confirm your office delivery availability.</p>
                </div>
                <SubscribeForm />
            </main>
            <Footer />
        </>
    );
}
