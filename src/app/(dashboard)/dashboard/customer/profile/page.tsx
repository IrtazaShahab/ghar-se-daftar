import { requireCustomerPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CustomerPageHeader, StatusBadge, formatDate } from "@/components/dashboard/customer-ui";
import { User, MapPin, Activity, Mail, Phone, Building2 } from "lucide-react";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
    const user = await requireCustomerPage("/dashboard/customer/profile");
    const [orderCount, subscription] = await Promise.all([prisma.order.count({ where: { userId: user.id } }), prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" } })]);
    const address = user.addresses[0];
    return <div className="space-y-8"><CustomerPageHeader title="My account" description="Your personal details, delivery information, and account overview." />
        <div className="grid gap-6 lg:grid-cols-2">
            <Card><h2 className="flex items-center gap-2 text-xl font-bold"><User className="size-5 text-primary" />Account information</h2><dl className="mt-6 grid gap-5 sm:grid-cols-2"><div><dt className="text-xs text-muted">Full name</dt><dd className="mt-1 font-bold">{user.fullName}</dd></div><div><dt className="text-xs text-muted">Account type</dt><dd className="mt-1"><StatusBadge status={user.role} /></dd></div><div><dt className="text-xs text-muted">Email</dt><dd className="mt-1 flex items-center gap-2 font-semibold"><Mail className="size-4 text-primary" />{user.email || "Not provided"}</dd></div><div><dt className="text-xs text-muted">Phone</dt><dd className="mt-1 flex items-center gap-2 font-semibold"><Phone className="size-4 text-primary" />{user.phone || "Not provided"}</dd></div><div><dt className="text-xs text-muted">Account status</dt><dd className="mt-1"><StatusBadge status={user.status} /></dd></div><div><dt className="text-xs text-muted">Member since</dt><dd className="mt-1 font-semibold">{formatDate(user.createdAt)}</dd></div></dl></Card>
            <Card><h2 className="flex items-center gap-2 text-xl font-bold"><MapPin className="size-5 text-primary" />Delivery information</h2><dl className="mt-6 space-y-5"><div><dt className="text-xs text-muted">Office / company</dt><dd className="mt-1 flex items-center gap-2 font-bold"><Building2 className="size-4 text-primary" />{user.profile?.companyName || "Not provided"}</dd></div><div><dt className="text-xs text-muted">Delivery address</dt><dd className="mt-1 font-semibold">{address ? `${address.address}, ${address.area}, ${address.city}` : user.profile?.officeAddress || "No delivery address saved"}</dd></div><div><dt className="text-xs text-muted">Delivery area</dt><dd className="mt-1 font-semibold">{user.profile?.deliveryArea || address?.area || "Not provided"}</dd></div><div><dt className="text-xs text-muted">Instructions</dt><dd className="mt-1 font-semibold">{user.profile?.deliveryInstructions || "None"}</dd></div></dl><ButtonLink href="/dashboard/customer/settings" variant="secondary" className="mt-6 w-full">Update details</ButtonLink></Card>
        </div>
        <Card><h2 className="flex items-center gap-2 text-xl font-bold"><Activity className="size-5 text-primary" />Account overview</h2><div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-primary/5 p-5"><p className="text-sm text-muted">Total orders</p><p className="mt-1 text-2xl font-bold">{orderCount}</p></div><div className="rounded-2xl bg-primary/5 p-5"><p className="text-sm text-muted">Current plan</p><p className="mt-1 text-2xl font-bold capitalize">{subscription ? subscription.planType.toLowerCase() : "None"}</p></div><div className="rounded-2xl bg-primary/5 p-5"><p className="text-sm text-muted">Email verification</p><p className="mt-1 text-lg font-bold">{user.emailVerified ? "Verified" : "Not recorded"}</p></div></div></Card>
    </div>;
}
