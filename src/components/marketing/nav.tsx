"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { useCartDrawer } from "@/components/providers/root-providers";

const links = [
  { label: "Menu", href: "/menu" },
  { label: "Plans", href: "/plans" },
  { label: "Corporate", href: "/corporate" },
  { label: "Home Chefs", href: "/home-chefs" },
  { label: "FAQ", href: "/faq" }
];

export function MarketingNav() {
  const { state } = useCart();
  const { openCart } = useCartDrawer();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav className="container-gsd flex h-20 items-center justify-between">
        <Link href="/">
          <LogoFull size="sm" />
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-muted transition hover:text-primary">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCart}
            className="relative rounded-full p-2 hover:bg-card transition"
            aria-label="Open cart"
          >
            <ShoppingBag className="size-5 text-primary" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center size-5 rounded-full bg-primary text-white text-xs font-bold">
                {itemCount}
              </span>
            )}
          </button>
          <ButtonLink href="/login" variant="secondary" className="hidden md:inline-flex">Login</ButtonLink>
          <ButtonLink href="/subscribe">Start Plan</ButtonLink>
        </div>
      </nav>
    </header>
  );
}
