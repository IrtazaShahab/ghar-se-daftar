"use client";

import { ReactNode, useState, createContext, useContext, useCallback } from "react";

type CartDrawerContextType = {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const value: CartDrawerContextType = {
    isOpen: isCartOpen,
    openCart,
    closeCart
  };

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  if (!context) {
    throw new Error("useCartDrawer must be used within CartDrawerProvider");
  }
  return context;
}
