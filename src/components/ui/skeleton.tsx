import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rect";
}

export function Skeleton({ className, variant = "rect", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-border/50",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded-md h-4 w-full",
        variant === "rect" && "rounded-[28px]",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-[28px] p-6">
      <Skeleton className="h-8 w-1/2 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
