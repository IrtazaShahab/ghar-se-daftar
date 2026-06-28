import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-card rounded-[28px] p-6 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/5",
        className
      )}
      {...props}
    />
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-secondary">
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
      <h2 className="font-serif text-4xl font-semibold leading-tight text-balance text-foreground md:text-5xl">
        {title}
      </h2>
      {description ? <p className="mt-5 text-lg leading-8 text-muted">{description}</p> : null}
    </div>
  );
}
