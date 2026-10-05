import type { ChefAssignmentStatus, CorporateQuoteStatus, CorporateRequestStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { PAYMENT_STATUS_LABELS } from "@/lib/orders/format";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "progress" | "good" | "bad" | "warn";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-border/60 text-foreground",
  info: "bg-accent/20 text-secondary",
  progress: "bg-primary/10 text-primary",
  good: "bg-success/15 text-success",
  bad: "bg-danger/10 text-danger",
  warn: "bg-orange-100 text-orange-700"
};

function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", TONE_CLASSES[tone], className)}>
      {children}
    </span>
  );
}

const ORDER_TONES: Record<OrderStatus, Tone> = {
  PENDING: "warn",
  CONFIRMED: "info",
  PREPARING: "progress",
  READY: "progress",
  OUT_FOR_DELIVERY: "progress",
  DELIVERED: "good",
  CANCELLED: "bad"
};

const PAYMENT_TONES: Record<PaymentStatus, Tone> = {
  PENDING: "warn",
  PROCESSING: "info",
  PAID: "good",
  FAILED: "bad",
  REFUNDED: "neutral",
  CANCELLED: "neutral"
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return <Pill tone={ORDER_TONES[status]} className={className}>{ORDER_STATUS_LABELS[status]}</Pill>;
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return <Pill tone={PAYMENT_TONES[status]} className={className}>{PAYMENT_STATUS_LABELS[status]}</Pill>;
}

const ASSIGNMENT_LABELS: Record<ChefAssignmentStatus, [string, Tone]> = {
  ASSIGNED: ["Awaiting chef", "warn"],
  ACCEPTED: ["Accepted", "good"],
  REPLACED: ["Reassigned", "neutral"],
  CANCELLED: ["Cancelled", "neutral"]
};

export function AssignmentBadge({ status }: { status: ChefAssignmentStatus }) {
  const [label, tone] = ASSIGNMENT_LABELS[status];
  return <Pill tone={tone}>{label}</Pill>;
}

const REQUEST_LABELS: Record<CorporateRequestStatus, [string, Tone]> = {
  NEW: ["New", "warn"],
  CONTACTED: ["Contacted", "info"],
  QUOTE_SENT: ["Quote sent", "progress"],
  ACCEPTED: ["Accepted", "good"],
  REJECTED: ["Rejected", "bad"],
  CONVERTED: ["Plan active", "good"]
};

export function CorporateRequestBadge({ status }: { status: CorporateRequestStatus }) {
  const [label, tone] = REQUEST_LABELS[status];
  return <Pill tone={tone}>{label}</Pill>;
}

const QUOTE_LABELS: Record<CorporateQuoteStatus, [string, Tone]> = {
  DRAFT: ["Draft", "neutral"],
  SENT: ["Sent", "progress"],
  ACCEPTED: ["Accepted", "good"],
  REJECTED: ["Rejected", "bad"],
  EXPIRED: ["Expired", "neutral"]
};

export function CorporateQuoteBadge({ status }: { status: CorporateQuoteStatus }) {
  const [label, tone] = QUOTE_LABELS[status];
  return <Pill tone={tone}>{label}</Pill>;
}
