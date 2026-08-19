"use client";

import { ReactNode, useState, createContext, useContext, useCallback, useEffect } from "react";

export type NavbarOverlay = "cart" | "profile" | "mobile-menu" | null;

type CartDrawerContextType = {
  isOpen: boolean;
  activeOverlay: NavbarOverlay;
  setActiveOverlay: (overlay: NavbarOverlay) => void;
  openCart: () => void;
  closeCart: () => void;
  closeOverlay: () => void;
  toggleOverlay: (overlay: Exclude<NavbarOverlay, null>) => void;
};

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [activeOverlay, setActiveOverlay] = useState<NavbarOverlay>(null);

  const openCart = useCallback(() => setActiveOverlay("cart"), []);
  const closeCart = useCallback(() => setActiveOverlay((current) => current === "cart" ? null : current), []);
  const closeOverlay = useCallback(() => setActiveOverlay(null), []);
  const toggleOverlay = useCallback((overlay: Exclude<NavbarOverlay, null>) => {
    setActiveOverlay((current) => current === overlay ? null : overlay);
  }, []);

  useEffect(() => {
    if (!activeOverlay) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveOverlay(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [activeOverlay]);

  const value: CartDrawerContextType = {
    isOpen: activeOverlay === "cart",
    activeOverlay,
    setActiveOverlay,
    openCart,
    closeCart,
    closeOverlay,
    toggleOverlay
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
