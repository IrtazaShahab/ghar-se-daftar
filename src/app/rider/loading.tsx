import { Skeleton } from "@/components/ui/skeleton";

export default function RiderLoading() {
  return (
    <div className="space-y-6" aria-label="Loading deliveries">
      <div className="space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-[24px]" />)}
      </div>
    </div>
  );
}
