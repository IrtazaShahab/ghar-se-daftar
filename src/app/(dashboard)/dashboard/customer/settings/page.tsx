import { requireCustomerPage } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CustomerPageHeader, StatusBadge } from "@/components/dashboard/customer-ui";
import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { LockKeyhole, User, Mail } from "lucide-react";

export const metadata = { title: "Account Settings" };

export default async function SettingsPage() {
    const user = await requireCustomerPage("/dashboard/customer/settings");
    return <div className="space-y-8"><CustomerPageHeader title="Settings" description="Manage the account and delivery details currently supported by Ghar Se Daftar." />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <Card><h2 className="flex items-center gap-2 text-xl font-bold"><User className="size-5 text-primary" />Profile & delivery</h2><p className="mt-2 text-sm text-muted">These details are used for your account and office deliveries.</p><ProfileSettingsForm defaults={{ fullName: user.fullName, companyName: user.profile?.companyName || "", officeAddress: user.profile?.officeAddress || "", deliveryArea: user.profile?.deliveryArea || "", deliveryInstructions: user.profile?.deliveryInstructions || "" }} /></Card>
            <div className="space-y-6">
                <Card><h2 className="flex items-center gap-2 text-xl font-bold"><Mail className="size-5 text-primary" />Account</h2><dl className="mt-5 space-y-4"><div><dt className="text-xs text-muted">Email</dt><dd className="mt-1 font-semibold">{user.email || "Not provided"}</dd></div><div><dt className="text-xs text-muted">Account type</dt><dd className="mt-1"><StatusBadge status={user.role} /></dd></div></dl><p className="mt-5 text-xs leading-5 text-muted">Email changes are not available here because the app does not yet synchronize Supabase Auth email changes with the Prisma account.</p></Card>
                <Card><h2 className="flex items-center gap-2 text-xl font-bold"><LockKeyhole className="size-5 text-primary" />Security</h2><p className="mt-2 text-sm leading-6 text-muted">Use the secure password-recovery flow to choose a new password. We’ll send instructions to your verified email.</p><ButtonLink href="/forgot-password" variant="secondary" className="mt-5 w-full">Change password</ButtonLink></Card>
            </div>
        </div>
    </div>;
}
