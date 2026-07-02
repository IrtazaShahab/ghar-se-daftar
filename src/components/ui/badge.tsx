import { cn } from "@/lib/utils";
import { memo } from "react";

function BadgeComponent({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-bold text-secondary",
        className
      )}
      {...props}
    />
  );
}

export const Badge = memo(BadgeComponent);
