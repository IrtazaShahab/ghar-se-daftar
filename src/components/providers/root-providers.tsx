"use client";

import { CartProvider } from "./cart-provider";
import { SmoothScrollProvider } from "./smooth-scroll-provider";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { CartDrawer } from "@/components/ordering/cart-drawer";
import { ReactNode } from "react";
import { CartDrawerProvider, useCartDrawer } from "./cart-drawer-provider";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <CartProvider>
        <CartDrawerProvider>
          <RootProvidersContent>
            {children}
          </RootProvidersContent>
        </CartDrawerProvider>
      </CartProvider>
    </SmoothScrollProvider>
  );
}

function RootProvidersContent({ children }: { children: ReactNode }) {
  const { isOpen, closeCart } = useCartDrawer();

  return (
    <>
      <CartDrawer isOpen={isOpen} onClose={closeCart} />
      {children}
      <WhatsAppButton />
    </>
  );
}

export { useCartDrawer };
