import { Skeleton } from "@/components/ui/skeleton";

export default function ChefLoading() {
  return (
    <div className="space-y-8" aria-label="Loading">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-[22px]" />)}
      </div>
      <Skeleton className="h-80 rounded-[22px]" />
    </div>
  );
}
