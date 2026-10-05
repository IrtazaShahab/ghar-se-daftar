import type { PaymentMethod } from "@prisma/client";
import type { PaymentProvider } from "./types";
import { cashOnDeliveryProvider, manualProvider } from "./providers/offline";
import { cardGatewayProvider, easypaisaProvider, jazzcashProvider } from "./providers/online";

const PROVIDERS: readonly PaymentProvider[] = [
  cashOnDeliveryProvider,
  manualProvider,
  easypaisaProvider,
  jazzcashProvider,
  cardGatewayProvider
];

export function getProviderForMethod(method: PaymentMethod): PaymentProvider {
  const provider = PROVIDERS.find((candidate) => candidate.methods.includes(method));
  if (!provider) throw new Error(`No payment provider registered for ${method}`);
  return provider;
}

export function getProviderById(id: string): PaymentProvider | null {
  return PROVIDERS.find((provider) => provider.id === id) ?? null;
}

export function listProviders() {
  return PROVIDERS;
}
