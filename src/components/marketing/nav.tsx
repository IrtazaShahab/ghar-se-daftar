"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useCartDrawer } from "@/components/providers/root-providers";
import { getCurrentUser } from "@/app/actions/auth";
import { useEffect, useState } from "react";

const links = [
  { label: "Menu", href: "/menu" },
  { label: "Plans", href: "/#plans" },
  { label: "Corporate", href: "/corporate" },
  { label: "Home Chefs", href: "/#chefs" },
  { label: "FAQ", href: "/#faq" }
];

export function MarketingNav() {
  const { state } = useCart();
  const { openCart } = useCartDrawer();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser().then((user) => {
      if (isMounted) setIsAuthenticated(Boolean(user));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/45 bg-[#f6f0e4]/86 backdrop-blur-xl">
      <nav className="container-gsd flex h-20 items-center justify-between">
        <Link href="/" className="group">
          <LogoFull size="sm" />
        </Link>

        <div className="hidden items-center gap-7 rounded-full border border-border/80 bg-white/55 px-6 py-3 shadow-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link text-sm font-bold text-primary/75">
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCart}
            className="focus-ring nav-icon-button relative grid size-11 place-items-center rounded-full border border-border bg-white/70 hover:border-primary/20 hover:bg-white"
            aria-label="Open cart"
          >
            <ShoppingBag className="size-5 text-primary" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center size-5 rounded-full bg-primary text-white text-xs font-bold">
                {itemCount}
              </span>
            )}
          </button>
          {isAuthenticated === false ? (
            <ButtonLink href="/login" variant="secondary" className="hidden md:inline-flex">Login</ButtonLink>
          ) : null}
          <ButtonLink href="/subscribe" className="hidden md:inline-flex">Start Plan</ButtonLink>
          <button
            className="focus-ring grid size-11 place-items-center rounded-full bg-primary text-white md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {isMenuOpen ? (
        <div className="border-t border-border/70 bg-card/96 px-4 py-5 shadow-2xl shadow-primary/10 md:hidden">
          <div className="mx-auto grid max-w-sm gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="nav-mobile-link rounded-2xl px-4 py-3 text-base font-bold text-primary hover:bg-primary/10"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {isAuthenticated === false ? (
                <ButtonLink href="/login" variant="secondary" onClick={() => setIsMenuOpen(false)}>Login</ButtonLink>
              ) : null}
              <ButtonLink href="/subscribe" onClick={() => setIsMenuOpen(false)}>Start Plan</ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
