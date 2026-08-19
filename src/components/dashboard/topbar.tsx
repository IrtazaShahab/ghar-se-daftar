"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User, ChevronDown, LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardTopbarProps {
  userName: string;
  userEmail?: string;
  role: string;
}

export function DashboardTopbar({ userName, userEmail, role }: DashboardTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
    router.refresh();
  };

  const roleDisplay = {
    CUSTOMER: "Customer",
    ADMIN: "Administrator",
    CORPORATE_ADMIN: "Corporate Admin",
    HOME_CHEF: "Chef"
  }[role] || role;
  const customerLinks = [
    { label: "Dashboard", href: "/dashboard/customer", icon: LayoutDashboard },
    { label: "Profile", href: "/dashboard/customer/profile", icon: User },
    { label: "Orders", href: "/dashboard/customer/orders", icon: ShoppingBag },
    { label: "Subscriptions", href: "/dashboard/customer/subscriptions", icon: UtensilsCrossed },
    { label: "Settings", href: "/dashboard/customer/settings", icon: Settings }
  ];

  return (
    <div className="flex items-center gap-6">
      {/* Role badge */}
      <div className="hidden sm:flex flex-col items-end">
        <p className="font-semibold text-sm text-foreground">{userName}</p>
        <p className="text-xs text-muted">{roleDisplay}</p>
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-[12px] hover:bg-card transition"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="size-4 text-primary" />
          </div>
          <ChevronDown className="size-4 text-muted" />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-[16px] bg-white border border-border shadow-lg z-50">
            <div className="p-4 border-b border-border">
              <p className="font-semibold text-sm">{userName}</p>
              <p className="text-xs text-muted">{userEmail}</p>
            </div>

            <div className="p-2">
              {role === "CUSTOMER" && customerLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn("flex items-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold transition", pathname === href ? "bg-primary text-white" : "text-foreground hover:bg-card")}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
              {role === "CUSTOMER" && <div className="my-2 border-t border-border" />}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-[12px] text-sm font-semibold text-danger hover:bg-danger/5 transition"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
