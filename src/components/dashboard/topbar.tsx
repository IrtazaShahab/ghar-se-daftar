"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User, ChevronDown } from "lucide-react";

interface DashboardTopbarProps {
  userName: string;
  userEmail?: string;
  role: string;
}

export function DashboardTopbar({ userName, userEmail, role }: DashboardTopbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const roleDisplay = {
    CUSTOMER: "Customer",
    ADMIN: "Administrator",
    CORPORATE_ADMIN: "Corporate Admin",
    HOME_CHEF: "Chef"
  }[role] || role;

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
