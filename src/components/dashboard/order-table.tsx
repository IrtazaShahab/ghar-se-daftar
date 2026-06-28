import { orderRows } from "@/data/dashboard";
import { Badge } from "@/components/ui/badge";

export function OrderTable() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-white/70">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-card text-xs uppercase tracking-[0.18em] text-muted">
          <tr>
            <th className="p-4">Order</th>
            <th className="p-4">Customer</th>
            <th className="p-4">Plan</th>
            <th className="p-4">Meal</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orderRows.map((row) => (
            <tr key={row.id}>
              <td className="p-4 font-bold">{row.id}</td>
              <td className="p-4">{row.customer}</td>
              <td className="p-4">{row.plan}</td>
              <td className="p-4">{row.meal}</td>
              <td className="p-4"><Badge>{row.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
