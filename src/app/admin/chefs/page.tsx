import { ChefHat, Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireAdminPage } from "@/lib/auth/guards";
import { addKitchen, createChef, setChefActive } from "@/app/actions/admin-chefs";
import { ActionButton, ActionForm } from "@/components/admin/action-controls";
import { Field, PageHeader, fieldClass } from "@/components/admin/ui";
import { Panel, PanelTitle } from "@/components/orders/order-details";

export const metadata = { title: "Chefs & kitchens" };

export default async function AdminChefsPage() {
  await requireAdminPage("/admin/chefs");

  const chefs = await prisma.homeChef.findMany({
    orderBy: [{ isActive: "desc" }, { displayName: "asc" }],
    include: {
      user: { select: { email: true, role: true } },
      kitchens: { orderBy: { createdAt: "asc" } },
      _count: { select: { orders: { where: { status: { in: ["CONFIRMED", "PREPARING", "READY"] } } } } }
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Chefs & kitchens" description="Chefs log in with their own account and only see orders assigned to them. They can accept, start and mark orders ready; nothing else." />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {chefs.length === 0 ? (
            <Panel className="py-12 text-center">
              <ChefHat className="mx-auto size-10 text-primary" aria-hidden="true" />
              <p className="mt-3 font-bold">No chefs yet</p>
              <p className="mt-1 text-sm text-muted">Add your first chef with the form. They need to sign up for an account first.</p>
            </Panel>
          ) : null}

          {chefs.map((chef) => (
            <Panel key={chef.id} className={chef.isActive ? undefined : "opacity-70"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold">{chef.displayName}</p>
                  <p className="text-sm text-muted">{chef.specialty}</p>
                  <p className="mt-1 text-xs text-muted">
                    {chef.area}, {chef.city}
                    {chef.phone ? ` · ${chef.phone}` : ""}
                    {chef.user?.email ? ` · ${chef.user.email}` : " · No linked login"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${chef.isActive ? "bg-success/15 text-success" : "bg-border/60"}`}>{chef.isActive ? "Active" : "Inactive"}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{chef._count.orders} open order{chef._count.orders === 1 ? "" : "s"}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {chef.kitchens.map((kitchen) => (
                  <div key={kitchen.id} className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm">
                    <p className="font-semibold">{kitchen.name}</p>
                    <p className="text-xs text-muted">{kitchen.area ?? chef.area}</p>
                  </div>
                ))}
              </div>

              <details className="mt-4 rounded-2xl border border-border bg-white/40 p-4">
                <summary className="cursor-pointer text-sm font-bold text-primary">Add kitchen</summary>
                <div className="mt-4">
                  <ActionForm action={addKitchen.bind(null, chef.id)} submitLabel="Add kitchen" resetOnSuccess>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Kitchen name"><input name="name" required className={fieldClass} placeholder="e.g. DHA kitchen" /></Field>
                      <Field label="Area (optional)"><input name="area" className={fieldClass} placeholder="e.g. DHA Phase 5" /></Field>
                    </div>
                  </ActionForm>
                </div>
              </details>

              <div className="mt-4 flex justify-end">
                <ActionButton
                  action={setChefActive.bind(null, chef.id, !chef.isActive)}
                  variant={chef.isActive ? "danger" : "secondary"}
                  confirmMessage={chef.isActive ? `Deactivate ${chef.displayName}? They will lose kitchen access and can't be assigned new orders.` : undefined}
                >
                  {chef.isActive ? "Deactivate" : "Activate"}
                </ActionButton>
              </div>
            </Panel>
          ))}
        </div>

        <Panel className="h-fit">
          <PanelTitle icon={Plus}>Add a chef</PanelTitle>
          <p className="mb-4 text-sm text-muted">Ask the chef to sign up at /signup first. Enter the same email here to give that account kitchen access.</p>
          <ActionForm action={createChef} submitLabel="Create chef" resetOnSuccess>
            <Field label="Account email"><input name="email" type="email" required className={fieldClass} placeholder="chef@example.com" /></Field>
            <Field label="Display name"><input name="displayName" required className={fieldClass} placeholder="Chef Shazia" /></Field>
            <Field label="Phone (optional)"><input name="phone" type="tel" className={fieldClass} placeholder="0300 1234567" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Area"><input name="area" required className={fieldClass} placeholder="Johar Town" /></Field>
              <Field label="City"><input name="city" defaultValue="Lahore" className={fieldClass} /></Field>
            </div>
            <Field label="Specialty"><input name="specialty" required className={fieldClass} placeholder="Daal, sabzi, biryani" /></Field>
            <Field label="First kitchen name"><input name="kitchenName" defaultValue="Home kitchen" className={fieldClass} /></Field>
          </ActionForm>
        </Panel>
      </div>
    </div>
  );
}
