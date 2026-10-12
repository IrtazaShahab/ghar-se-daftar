import { Skeleton } from "@/components/ui/skeleton";

/** Route-level loading states shaped like the page they stand in for, so nothing jumps when data arrives. */

function Header() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-56 max-w-full" />
      <Skeleton className="h-5 w-96 max-w-full" />
    </div>
  );
}

export function TablePageSkeleton({ label = "Loading", filters = true }: { label?: string; filters?: boolean }) {
  return (
    <div className="space-y-6" aria-label={label} aria-busy="true">
      <Header />
      {filters ? <Skeleton className="h-28 rounded-[22px]" /> : <Skeleton className="h-14 w-full max-w-2xl rounded-[22px]" />}
      <div className="glass-card space-y-3 rounded-[22px] p-4">
        {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-xl" />)}
      </div>
    </div>
  );
}

export function DetailPageSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-6" aria-label={label} aria-busy="true">
      <Skeleton className="h-5 w-28" />
      <Header />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48 rounded-[26px]" />
            <Skeleton className="h-48 rounded-[26px]" />
          </div>
          <Skeleton className="h-64 rounded-[26px]" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-[26px]" />
          <Skeleton className="h-56 rounded-[26px]" />
        </div>
      </div>
    </div>
  );
}

export function CardListPageSkeleton({ label = "Loading", tabs = false, cards = 4 }: { label?: string; tabs?: boolean; cards?: number }) {
  return (
    <div className="space-y-6" aria-label={label} aria-busy="true">
      <Header />
      {tabs ? <Skeleton className="h-14 w-full max-w-2xl rounded-[22px]" /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: cards }).map((_, index) => <Skeleton key={index} className="h-52 rounded-[24px]" />)}
      </div>
    </div>
  );
}
