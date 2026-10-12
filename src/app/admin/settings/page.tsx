import { Clock, Plus } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/guards";
import { createServiceWindow, updateServiceWindow } from "@/app/actions/admin-settings";
import { listServiceWindows } from "@/lib/orders/service-windows-db";
import { describeCutoffs, formatClock, parseTime, slotsForWindow } from "@/lib/orders/service-windows";
import { ActionForm } from "@/components/admin/action-controls";
import { Field, PageHeader, fieldClass } from "@/components/admin/ui";
import { Panel, PanelTitle } from "@/components/orders/order-details";

export const metadata = { title: "Delivery settings" };

function WindowFields({ defaults }: { defaults?: { label: string; startTime: string; endTime: string; slotMinutes: number; cutoffMinutes: number; sortOrder: number; isActive: boolean } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Name" className="sm:col-span-2"><input name="label" required maxLength={40} defaultValue={defaults?.label} className={fieldClass} placeholder="Lunch" /></Field>
      <Field label="Starts (24h)"><input name="startTime" type="time" required defaultValue={defaults?.startTime ?? "12:00"} className={fieldClass} /></Field>
      <Field label="Ends (24h)"><input name="endTime" type="time" required defaultValue={defaults?.endTime ?? "16:00"} className={fieldClass} /></Field>
      <Field label="Slot length (minutes)"><input name="slotMinutes" type="number" min={15} max={240} step={15} required defaultValue={defaults?.slotMinutes ?? 60} className={fieldClass} /></Field>
      <Field label="Same-day cutoff (minutes before start)"><input name="cutoffMinutes" type="number" min={0} max={1440} step={5} required defaultValue={defaults?.cutoffMinutes ?? 90} className={fieldClass} /></Field>
      <Field label="Order shown"><input name="sortOrder" type="number" min={0} max={99} defaultValue={defaults?.sortOrder ?? 0} className={fieldClass} /></Field>
      <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold">
        <input name="isActive" type="checkbox" defaultChecked={defaults?.isActive ?? true} className="size-4 accent-[#214f32]" />
        Offered at checkout
      </label>
    </div>
  );
}

export default async function DeliverySettingsPage() {
  await requireAdminPage("/admin/settings");
  const windows = await listServiceWindows();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery settings"
        description="Delivery windows offered at checkout (Pakistan time). Same-day orders for a window close the given number of minutes before it starts; later orders move to that menu day next week."
      />

      {windows.length > 0 ? (
        <p className="rounded-2xl bg-primary/5 px-4 py-3 text-sm text-primary">
          <strong>Same-day ordering now:</strong> {describeCutoffs(windows) || "no active windows; checkout will show no delivery times."}
        </p>
      ) : (
        <p className="rounded-2xl bg-accent/15 px-4 py-3 text-sm text-secondary">No windows are configured, so checkout uses the built-in defaults (Lunch, Late lunch, Dinner). Add a window to take control.</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          {windows.map((window) => {
            const start = parseTime(window.startTime);
            const slots = slotsForWindow(window);
            return (
              <Panel key={window.id} className={window.isActive ? undefined : "opacity-75"}>
                <PanelTitle icon={Clock}>
                  {window.label} · {formatClock(start ?? 0)} – {formatClock(parseTime(window.endTime) ?? 0)}
                </PanelTitle>
                <p className="mb-4 text-xs text-muted">
                  {window.isActive ? `${slots.length} slot${slots.length === 1 ? "" : "s"}: ${slots.map((slot) => slot.label).join(", ")}` : "Not offered at checkout."}
                </p>
                <ActionForm action={updateServiceWindow.bind(null, window.id)} submitLabel="Save window" pendingLabel="Saving…">
                  <WindowFields defaults={window} />
                </ActionForm>
              </Panel>
            );
          })}
        </div>

        <Panel className="h-fit">
          <PanelTitle icon={Plus}>Add a window</PanelTitle>
          <ActionForm action={createServiceWindow} submitLabel="Add window" resetOnSuccess>
            <WindowFields />
          </ActionForm>
        </Panel>
      </div>
    </div>
  );
}
