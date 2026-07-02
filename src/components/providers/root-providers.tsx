"use client";

import { CartProvider } from "./cart-provider";
import { SmoothScrollProvider } from "./smooth-scroll-provider";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { CartDrawer } from "@/components/ordering/cart-drawer";
import { ReactNode } from "react";
import { CartDrawerProvider, useCartDrawer } from "./cart-drawer-provider";
import { usePathname } from "next/navigation";

export function RootProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lightweightRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/unauthorized");

  if (lightweightRoute) {
    return <>{children}</>;
  }

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
