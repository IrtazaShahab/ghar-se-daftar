import type { DeliveryStatus } from "@prisma/client";
import { DELIVERY_STATUS_LABELS } from "@/lib/delivery/status";
import { cn } from "@/lib/utils";

const TONES: Record<DeliveryStatus, string> = {
  ASSIGNED: "bg-orange-100 text-orange-700",
  ACCEPTED: "bg-accent/20 text-secondary",
  PICKED_UP: "bg-primary/10 text-primary",
  DELIVERED: "bg-success/15 text-success",
  CANCELLED: "bg-border/60 text-foreground"
};

export function DeliveryStatusBadge({ status, label, className }: { status: DeliveryStatus; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", TONES[status], className)}>
      {label ?? DELIVERY_STATUS_LABELS[status]}
    </span>
  );
}
