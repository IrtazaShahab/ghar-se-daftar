import { ChefHat } from "lucide-react";
import { Panel } from "@/components/orders/order-details";

export function ChefInactiveNotice() {
  return (
    <Panel className="mx-auto max-w-lg py-12 text-center">
      <ChefHat className="mx-auto size-10 text-primary" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-extrabold">Kitchen access isn&rsquo;t active</h1>
      <p className="mt-2 text-sm text-muted">Your chef profile hasn&rsquo;t been set up or is paused. Please contact the Ghar Se Daftar team.</p>
    </Panel>
  );
}
