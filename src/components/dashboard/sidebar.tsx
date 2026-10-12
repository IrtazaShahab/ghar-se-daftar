"use client";

import { LogoMark } from "@/components/brand/logo";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  BarChart3,
  Settings,
  Users,
  UtensilsCrossed,
  ClipboardList,
  Grid3x3,
  User,
  ChefHat,
  LogOut,
  Wallet,
  Bike,
  Truck,
  Clock,
  Loader2,
  type LucideIcon
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { clearNavUser } from "@/lib/auth/nav-session";
import { homePathForRole, isOperationalStaff } from "@/lib/auth/roles";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navConfigs: Record<string, NavItem[]> = {
  CUSTOMER: [
    { label: "Dashboard", href: "/dashboard/customer", icon: Grid3x3 },
    { label: "Profile", href: "/dashboard/customer/profile", icon: User },
    { label: "Orders", href: "/dashboard/customer/orders", icon: ShoppingBag },
    { label: "Subscriptions", href: "/dashboard/customer/subscriptions", icon: UtensilsCrossed },
    { label: "Settings", href: "/dashboard/customer/settings", icon: Settings }
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: BarChart3 },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Deliveries", href: "/admin/deliveries", icon: Truck },
    { label: "Payments", href: "/admin/payments", icon: Wallet },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Corporate", href: "/admin/corporate", icon: ClipboardList },
    { label: "Chefs & Kitchens", href: "/admin/chefs", icon: ChefHat },
    { label: "Riders", href: "/admin/riders", icon: Bike },
    { label: "Delivery settings", href: "/admin/settings", icon: Clock }
  ],
  CORPORATE_ADMIN: [
    { label: "Dashboard", href: "/dashboard/corporate", icon: Grid3x3 },
    { label: "Team Orders", href: "/dashboard/corporate/orders", icon: ShoppingBag },
    { label: "Team Members", href: "/dashboard/corporate/members", icon: Users },
    { label: "Invoices", href: "/dashboard/corporate/invoices", icon: ClipboardList },
    { label: "Settings", href: "/dashboard/corporate/settings", icon: Settings }
  ],
  HOME_CHEF: [
    { label: "Kitchen", href: "/chef", icon: Grid3x3 },
    { label: "Orders", href: "/chef/orders", icon: ShoppingBag }
  ],
  RIDER: [
    { label: "Today", href: "/rider", icon: Grid3x3 },
    { label: "Deliveries", href: "/rider/deliveries", icon: Bike }
  ]
};

const ROOTS = new Set(["/dashboard/customer", "/admin", "/chef", "/rider"]);

/**
 * Rendered inside <Link>: the clicked item highlights and shows a spinner the
 * moment it's clicked, while the next page loads (useLinkStatus), so a click
 * is never left without feedback.
 */
function NavItemBody({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { pending } = useLinkStatus();
  const Icon = item.icon;
  return (
    <span
      className={cn(
        "flex items-center gap-3 rounded-[12px] px-4 py-3 text-sm font-semibold transition",
        isActive || pending ? "bg-primary text-white" : "text-muted hover:bg-card",
        pending && !isActive && "bg-primary/85"
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {pending ? <Loader2 className="size-4 shrink-0 animate-spin" aria-label="Loading" /> : null}
    </span>
  );
}

export function DashboardSidebar({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = navConfigs[role] || [];
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-border p-6">
        {/* Chef and rider accounts stay in their portal; the public site is for customers. */}
        <Link href={isOperationalStaff(role) ? homePathForRole(role) : "/"}>
          <LogoMark size="lg" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6" aria-label="Dashboard">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (!ROOTS.has(item.href) && pathname.startsWith(item.href + "/"));
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={isActive ? "page" : undefined} className="focus-ring block rounded-[12px]">
              <NavItemBody item={item} isActive={isActive} />
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-6">
        <button
          type="button"
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true);
            try {
              await logout();
              clearNavUser();
              router.replace("/");
              router.refresh();
            } finally {
              setLoggingOut(false);
            }
          }}
          className="focus-ring mb-5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-danger hover:bg-danger/10 disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}
          {loggingOut ? "Logging out…" : "Logout"}
        </button>
        <div className="text-xs text-muted">
          <p>Ghar Se Daftar v1.0</p>
          <p>© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
