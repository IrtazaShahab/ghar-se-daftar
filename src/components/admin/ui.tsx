import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small building blocks shared by the admin and kitchen areas. */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-muted">{description}</p> : null}
      </div>
      {actions}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  tone?: "primary" | "warn" | "good" | "bad";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    warn: "bg-orange-100 text-orange-700",
    good: "bg-success/15 text-success",
    bad: "bg-danger/10 text-danger"
  }[tone];

  const body = (
    <>
      <span className={cn("grid size-10 place-items-center rounded-[12px]", toneClass)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </>
  );

  const className = "glass-card block rounded-[22px] p-5 transition";
  return href ? (
    <Link href={href} className={cn(className, "focus-ring hover:border-primary/30 hover:bg-white")}>{body}</Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-muted">{children}</td>
    </tr>
  );
}

/** Horizontally scrollable table container (mobile friendly). */
export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card overflow-hidden rounded-[22px]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={cn("bg-card px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-t border-border px-4 py-3 align-top", className)}>{children}</td>;
}

export const fieldClass =
  "focus-ring h-11 w-full min-w-0 rounded-[14px] border border-border bg-white/85 px-3 text-sm transition hover:border-primary/30 focus:border-primary";

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("grid min-w-0 gap-1.5 text-sm font-semibold", className)}>
      {label}
      {children}
    </label>
  );
}

/** Previous/next links for list pages; keeps the current filters. */
export function Pagination({ page, pageCount, params, basePath }: { page: number; pageCount: number; params: Record<string, string | undefined>; basePath: string }) {
  if (pageCount <= 1) return null;
  const href = (target: number) => {
    const search = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
    search.set("page", String(target));
    return `${basePath}?${search.toString()}`;
  };
  const linkClass = "focus-ring inline-flex h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-bold text-primary hover:bg-card";

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      <p className="text-sm text-muted">Page {page} of {pageCount}</p>
      <div className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className={linkClass}>Previous</Link> : null}
        {page < pageCount ? <Link href={href(page + 1)} className={linkClass}>Next</Link> : null}
      </div>
    </nav>
  );
}
