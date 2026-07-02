import { cn } from "@/lib/utils";
import { memo } from "react";

function CardComponent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-card premium-lift rounded-[26px] p-6",
        className
      )}
      {...props}
    />
  );
}

function SectionLabelComponent({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex rounded-full border border-primary/10 bg-white/70 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
      {children}
    </div>
  );
}

function SectionHeaderComponent({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="section-reveal mx-auto mb-12 max-w-3xl text-center">
      {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
      <h2 className="text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground md:text-5xl">
        {title}
      </h2>
      {description ? <p className="mt-5 text-base leading-8 text-muted md:text-lg">{description}</p> : null}
    </div>
  );
}

export const Card = memo(CardComponent);
export const SectionLabel = memo(SectionLabelComponent);
export const SectionHeader = memo(SectionHeaderComponent);
