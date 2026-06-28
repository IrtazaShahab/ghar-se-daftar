"use client";

import { ReactNode } from "react";
import { CartProvider as CartContextProvider } from "@/store/cart";

export function CartProvider({ children }: { children: ReactNode }) {
  return <CartContextProvider>{children}</CartContextProvider>;
}
