"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import { LayoutDashboard, LogOut, Menu, Settings, ShoppingBag, User, UtensilsCrossed, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useCartDrawer } from "@/components/providers/root-providers";
import { getCurrentUser, logout } from "@/app/actions/auth";
import { useEffect, useRef, useState } from "react";

const links = [
  { label: "Menu", href: "/menu" },
  { label: "Plans", href: "/#plans" },
  { label: "Corporate", href: "/corporate" },
  { label: "Home Chefs", href: "/#chefs" },
  { label: "FAQ", href: "/#faq" }
];

export function MarketingNav() {
  const router = useRouter();
  const { state } = useCart();
  const { openCart, activeOverlay, toggleOverlay, closeOverlay } = useCartDrawer();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser().then((user) => {
      if (isMounted) {
        setIsAuthenticated(Boolean(user));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeOverlay !== "profile") return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) closeOverlay();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOverlay();
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeOverlay, closeOverlay]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const result = await logout();

    if (result.success) {
      setIsAuthenticated(false);
      closeOverlay();
      router.refresh();
    }

    setIsLoggingOut(false);
  };

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
          {isAuthenticated ? (
            <div className="relative hidden md:block">
              <div ref={accountMenuRef}>
              <button type="button" onClick={() => toggleOverlay("profile")} className="focus-ring nav-icon-button grid size-11 place-items-center rounded-full border border-border bg-white/70 text-primary hover:border-primary/20 hover:bg-white" aria-label="Open account menu" aria-expanded={activeOverlay === "profile"} aria-haspopup="menu"><User className="size-5" /></button>
                <div role="menu" aria-label="Account navigation" aria-hidden={activeOverlay !== "profile"} className={`absolute right-0 top-full mt-3 w-64 origin-top-right overflow-hidden rounded-[22px] border border-border bg-card p-2 shadow-xl shadow-primary/10 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${activeOverlay === "profile" ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1.5 scale-[.98] opacity-0"}`}>
                    {[
                      { label: "Dashboard", href: "/dashboard/customer", Icon: LayoutDashboard },
                      { label: "Orders", href: "/dashboard/customer/orders", Icon: ShoppingBag },
                      { label: "Subscriptions", href: "/dashboard/customer/subscriptions", Icon: UtensilsCrossed },
                      { label: "Settings", href: "/dashboard/customer/settings", Icon: Settings }
                    ].map(({ label, href, Icon }) => <Link role="menuitem" key={href} href={href} onClick={closeOverlay} className="focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-foreground hover:bg-primary hover:text-white [&:hover_svg]:text-white"><Icon className="size-4 text-primary" />{label}</Link>)}
                    <div className="my-2 border-t border-border" />
                    <button role="menuitem" type="button" onClick={handleLogout} disabled={isLoggingOut} className="focus-ring flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-danger hover:bg-danger/10"><LogOut className="size-4" />{isLoggingOut ? "Logging out..." : "Logout"}</button>
                </div>
              </div>
            </div>
          ) : isAuthenticated === false ? (
            <ButtonLink href="/login" variant="secondary" className="hidden md:inline-flex">Login</ButtonLink>
          ) : null}
          <ButtonLink href="/subscribe" className="hidden md:inline-flex">Start Plan</ButtonLink>
          <button
            className="focus-ring grid size-11 place-items-center rounded-full bg-primary text-white md:hidden"
            onClick={() => toggleOverlay("mobile-menu")}
            aria-label={activeOverlay === "mobile-menu" ? "Close menu" : "Open menu"}
            aria-expanded={activeOverlay === "mobile-menu"}
          >
            {activeOverlay === "mobile-menu" ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {activeOverlay === "mobile-menu" ? (
        <div className="border-t border-border/70 bg-card/96 px-4 py-5 shadow-2xl shadow-primary/10 md:hidden">
          <div className="mx-auto grid max-w-sm gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeOverlay}
                className="nav-mobile-link rounded-2xl px-4 py-3 text-base font-bold text-primary hover:bg-primary/10"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <div className="mt-2 grid gap-1 border-t border-border pt-3">
                {[
                  { label: "Dashboard", href: "/dashboard/customer", Icon: LayoutDashboard },
                  { label: "Orders", href: "/dashboard/customer/orders", Icon: ShoppingBag },
                  { label: "Subscriptions", href: "/dashboard/customer/subscriptions", Icon: UtensilsCrossed },
                  { label: "Settings", href: "/dashboard/customer/settings", Icon: Settings }
                ].map(({ label, href, Icon }) => <Link key={href} href={href} onClick={closeOverlay} className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-primary hover:bg-primary/10"><Icon className="size-4" />{label}</Link>)}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {isAuthenticated ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="size-4" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              ) : isAuthenticated === false ? (
                  <ButtonLink href="/login" variant="secondary" onClick={closeOverlay}>Login</ButtonLink>
              ) : null}
              <ButtonLink href="/subscribe" onClick={closeOverlay}>Start Plan</ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
