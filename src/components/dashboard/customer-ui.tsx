import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

export function CustomerPageHeader({ title, description }: { title: string; description: string }) {
  return <header><h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-muted">{description}</p></header>;
}

export function EmptyState({ icon: Icon, title, description, href, action }: { icon: LucideIcon; title: string; description: string; href: string; action: string }) {
  return <Card className="py-14 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10"><Icon className="size-6 text-primary" /></span><h2 className="mt-5 text-xl font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p><ButtonLink href={href} className="mt-6">{action}</ButtonLink></Card>;
}

export function StatusBadge({ status }: { status: string }) {
  const good = ["ACTIVE", "DELIVERED", "CONFIRMED"].includes(status);
  const bad = ["CANCELLED", "EXPIRED"].includes(status);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${good ? "bg-success/10 text-success" : bad ? "bg-danger/10 text-danger" : "bg-accent/20 text-secondary"}`}>{status.replaceAll("_", " ")}</span>;
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(date);
}
