import { Bike } from "lucide-react";
import { Panel } from "@/components/orders/order-details";

export function RiderInactiveNotice() {
  return (
    <Panel className="mx-auto max-w-lg py-12 text-center">
      <Bike className="mx-auto size-10 text-primary" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-extrabold">Rider access isn&rsquo;t active</h1>
      <p className="mt-2 text-sm text-muted">Your rider profile hasn&rsquo;t been set up or is paused. Please contact the Ghar Se Daftar team.</p>
    </Panel>
  );
}
