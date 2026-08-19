"use client";

import { LogoMark } from "@/components/brand/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  BarChart3,
  Settings,
  Users,
  UtensilsCrossed,
  ClipboardList,
  Grid3x3, User,
  ChefHat,
  LogOut
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navConfigs: Record<string, NavItem[]> = {
  CUSTOMER: [
    { label: "Dashboard", href: "/dashboard/customer", icon: <Grid3x3 className="size-5" /> },
    { label: "Profile", href: "/dashboard/customer/profile", icon: <User className="size-5" /> },
    { label: "Orders", href: "/dashboard/customer/orders", icon: <ShoppingBag className="size-5" /> },
    { label: "Subscriptions", href: "/dashboard/customer/subscriptions", icon: <UtensilsCrossed className="size-5" /> },
    { label: "Settings", href: "/dashboard/customer/settings", icon: <Settings className="size-5" /> }
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin", icon: <BarChart3 className="size-5" /> },
    { label: "Orders", href: "/dashboard/admin/orders", icon: <ShoppingBag className="size-5" /> },
    { label: "Menu", href: "/dashboard/admin/menu", icon: <UtensilsCrossed className="size-5" /> },
    { label: "Customers", href: "/dashboard/admin/customers", icon: <Users className="size-5" /> },
    { label: "Chefs", href: "/dashboard/admin/chefs", icon: <ChefHat className="size-5" /> },
    { label: "Corporate", href: "/dashboard/admin/corporate", icon: <ClipboardList className="size-5" /> },
    { label: "Settings", href: "/dashboard/admin/settings", icon: <Settings className="size-5" /> }
  ],
  CORPORATE_ADMIN: [
    { label: "Dashboard", href: "/dashboard/corporate", icon: <Grid3x3 className="size-5" /> },
    { label: "Team Orders", href: "/dashboard/corporate/orders", icon: <ShoppingBag className="size-5" /> },
    { label: "Team Members", href: "/dashboard/corporate/members", icon: <Users className="size-5" /> },
    { label: "Invoices", href: "/dashboard/corporate/invoices", icon: <ClipboardList className="size-5" /> },
    { label: "Settings", href: "/dashboard/corporate/settings", icon: <Settings className="size-5" /> }
  ],
  HOME_CHEF: [
    { label: "Dashboard", href: "/dashboard/chef", icon: <Grid3x3 className="size-5" /> },
    { label: "Today's Orders", href: "/dashboard/chef/today", icon: <ShoppingBag className="size-5" /> },
    { label: "Schedule", href: "/dashboard/chef/schedule", icon: <ClipboardList className="size-5" /> },
    { label: "Earnings", href: "/dashboard/chef/earnings", icon: <BarChart3 className="size-5" /> },
    { label: "Settings", href: "/dashboard/chef/settings", icon: <Settings className="size-5" /> }
  ]
};

export function DashboardSidebar({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = navConfigs[role] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/">
          <LogoMark size="lg" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard/customer" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold text-sm transition",
                isActive
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-card"
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-danger text-white text-xs rounded-full px-2 py-1">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <button type="button" onClick={async () => { await logout(); router.replace("/"); router.refresh(); }} className="focus-ring mb-5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-danger hover:bg-danger/10"><LogOut className="size-4" />Logout</button>
        <div className="text-xs text-muted">
          <p>Ghar Se Daftar v1.0</p>
          <p>© 2024 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
