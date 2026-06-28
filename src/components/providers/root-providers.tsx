"use client";

import { CartProvider } from "./cart-provider";
import { SmoothScrollProvider } from "./smooth-scroll-provider";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { CartDrawer } from "@/components/ordering/cart-drawer";
import { ReactNode, useState, createContext, useContext } from "react";

type CartDrawerContextType = {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  if (!context) {
    throw new Error("useCartDrawer must be used within RootProviders");
  }
  return context;
}

export function RootProviders({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartDrawerValue: CartDrawerContextType = {
    isOpen: isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false)
  };

  return (
    <CartDrawerContext.Provider value={cartDrawerValue}>
      <SmoothScrollProvider>
        <CartProvider>
          <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
          {children}
          <WhatsAppButton />
        </CartProvider>
      </SmoothScrollProvider>
    </CartDrawerContext.Provider>
  );
}
