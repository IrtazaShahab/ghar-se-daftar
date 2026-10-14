import { Bike, Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireAdminPage } from "@/lib/auth/guards";
import { createRider, setRiderActive } from "@/app/actions/admin-riders";
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/delivery/status";
import { ActionButton, ActionForm } from "@/components/admin/action-controls";
import { Field, PageHeader, fieldClass } from "@/components/admin/ui";
import { Panel, PanelTitle } from "@/components/orders/order-details";

export const metadata = { title: "Riders" };

export default async function AdminRidersPage() {
  await requireAdminPage("/admin/riders");

  const riders = await prisma.rider.findMany({
    orderBy: [{ isActive: "desc" }, { displayName: "asc" }],
    select: {
      id: true,
      displayName: true,
      phone: true,
      isActive: true,
      user: { select: { email: true } },
      _count: { select: { deliveries: { where: { status: { in: [...ACTIVE_DELIVERY_STATUSES] } } } } }
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Riders" description="Riders log in with their own account and only see deliveries assigned to them: pickup, drop-off and the cash to collect. Nothing else." />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          {riders.length === 0 ? (
            <Panel className="py-12 text-center">
              <Bike className="mx-auto size-10 text-primary" aria-hidden="true" />
              <p className="mt-3 font-bold">No riders yet</p>
              <p className="mt-1 text-sm text-muted">Add your first rider with the form. They need to sign up for an account first.</p>
            </Panel>
          ) : null}

          {riders.map((rider) => (
            <Panel key={rider.id} className={rider.isActive ? undefined : "opacity-70"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-extrabold">{rider.displayName}</p>
                  <p className="break-all text-xs text-muted">
                    <a href={`tel:${rider.phone}`} className="font-semibold text-primary hover:underline">{rider.phone}</a>
                    {rider.user?.email ? ` · ${rider.user.email}` : " · No linked login"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${rider.isActive ? "bg-success/15 text-success" : "bg-border/60"}`}>{rider.isActive ? "Active" : "Inactive"}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {rider._count.deliveries} active deliver{rider._count.deliveries === 1 ? "y" : "ies"}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <ActionButton
                  action={setRiderActive.bind(null, rider.id, !rider.isActive)}
                  variant={rider.isActive ? "danger" : "secondary"}
                  confirmMessage={rider.isActive ? `Deactivate ${rider.displayName}? They will lose access to the rider app and can't be assigned deliveries.` : undefined}
                >
                  {rider.isActive ? "Deactivate" : "Activate"}
                </ActionButton>
              </div>
            </Panel>
          ))}
        </div>

        <Panel className="h-fit">
          <PanelTitle icon={Plus}>Add a rider</PanelTitle>
          <p className="mb-4 text-sm text-muted">Ask the rider to sign up at /signup first. Enter the same email here to give that account rider access. Customers will see the name and, during a delivery, the phone number.</p>
          <ActionForm action={createRider} submitLabel="Create rider" resetOnSuccess>
            <Field label="Account email"><input name="email" type="email" required className={fieldClass} placeholder="rider@example.com" /></Field>
            <Field label="Name shown to customers"><input name="displayName" required className={fieldClass} placeholder="Ali" /></Field>
            <Field label="Phone for deliveries"><input name="phone" type="tel" required className={fieldClass} placeholder="0300 1234567" /></Field>
          </ActionForm>
        </Panel>
      </div>
    </div>
  );
}
