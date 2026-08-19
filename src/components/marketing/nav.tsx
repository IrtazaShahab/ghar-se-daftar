"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import { LayoutDashboard, LogOut, Menu, Settings, ShoppingBag, User, UtensilsCrossed, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useCartDrawer } from "@/components/providers/root-providers";
import { getCurrentUser, logout } from "@/app/actions/auth";
import { useEffect, useState } from "react";

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
  const { openCart } = useCartDrawer();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [customer, setCustomer] = useState<{ fullName: string; email: string | null } | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser().then((user) => {
      if (isMounted) {
        setIsAuthenticated(Boolean(user));
        setCustomer(user ? { fullName: user.fullName, email: user.email } : null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const result = await logout();

    if (result.success) {
      setIsAuthenticated(false);
      setCustomer(null);
      setAccountOpen(false);
      setIsMenuOpen(false);
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
              <button type="button" onClick={() => setAccountOpen((open) => !open)} className="focus-ring grid size-11 place-items-center rounded-full border border-border bg-white text-primary hover:bg-card" aria-label="Open account menu" aria-expanded={accountOpen}><User className="size-5" /></button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-[20px] border border-border bg-white shadow-2xl shadow-primary/10">
                  <div className="border-b border-border p-4"><p className="font-bold">{customer?.fullName}</p><p className="truncate text-xs text-muted">{customer?.email}</p></div>
                  <div className="p-2">
                    {[
                      { label: "Dashboard", href: "/dashboard/customer", Icon: LayoutDashboard },
                      { label: "Orders", href: "/dashboard/customer/orders", Icon: ShoppingBag },
                      { label: "Subscriptions", href: "/dashboard/customer/subscriptions", Icon: UtensilsCrossed },
                      { label: "Settings", href: "/dashboard/customer/settings", Icon: Settings }
                    ].map(({ label, href, Icon }) => <Link key={href} href={href} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-card"><Icon className="size-4 text-primary" />{label}</Link>)}
                    <div className="my-2 border-t border-border" />
                    <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-danger hover:bg-danger/5"><LogOut className="size-4" />{isLoggingOut ? "Logging out..." : "Logout"}</button>
                  </div>
                </div>
              )}
            </div>
          ) : isAuthenticated === false ? (
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
            {isAuthenticated && (
              <div className="mt-2 grid gap-1 border-t border-border pt-3">
                <p className="px-4 pb-2 text-xs font-bold uppercase tracking-wider text-muted">{customer?.fullName}</p>
                {[
                  { label: "Dashboard", href: "/dashboard/customer", Icon: LayoutDashboard },
                  { label: "Orders", href: "/dashboard/customer/orders", Icon: ShoppingBag },
                  { label: "Subscriptions", href: "/dashboard/customer/subscriptions", Icon: UtensilsCrossed },
                  { label: "Settings", href: "/dashboard/customer/settings", Icon: Settings }
                ].map(({ label, href, Icon }) => <Link key={href} href={href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-primary hover:bg-primary/10"><Icon className="size-4" />{label}</Link>)}
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
