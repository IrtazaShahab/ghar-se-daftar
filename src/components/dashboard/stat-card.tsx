import { Card } from "@/components/ui/card";

export function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <div className="font-serif text-4xl font-semibold">{value}</div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{trend}</div>
      </div>
    </Card>
  );
}
