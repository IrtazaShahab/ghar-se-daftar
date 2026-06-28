"use client";

import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./sidebar";
import { DashboardTopbar } from "./topbar";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export interface DashboardShellProps {
  children: ReactNode;
  role: string;
  userName: string;
  userEmail?: string;
}

export function DashboardShell({ children, role, userName, userEmail }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:block w-64 border-r border-border bg-white">
        <DashboardSidebar role={role} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <DashboardSidebar role={role} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-border bg-white">
          <div className="flex items-center justify-between h-16 px-4 md:px-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden rounded-full p-2 hover:bg-card transition"
            >
              {sidebarOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>

            <div className="flex-1 hidden md:block" />

            <DashboardTopbar
              userName={userName}
              userEmail={userEmail}
              role={role}
            />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="container-gsd py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
