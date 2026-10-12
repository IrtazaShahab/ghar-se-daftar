"use client";

import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "./sidebar";
import { DashboardTopbar } from "./topbar";

export interface DashboardShellProps {
  children: ReactNode;
  role: string;
  userName: string;
  userEmail?: string;
}

/**
 * Sidebar + scrolling content area. Width rules that keep the page inside the
 * viewport: the sidebar never shrinks, the content column is `min-w-0` so wide
 * children (tables) scroll inside their own containers instead of widening the
 * page, and the shell uses the dynamic viewport height so mobile browser bars
 * don't crop it.
 */
export function DashboardShell({ children, role, userName, userEmail }: DashboardShellProps) {
  // The mobile drawer closes itself when a link in it is clicked (onNavigate).
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-white md:block">
        <DashboardSidebar role={role} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] transform border-r border-border bg-white transition-transform md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
      >
        <DashboardSidebar role={role} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 border-b border-border bg-white">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="focus-ring rounded-full p-2 transition hover:bg-card md:hidden"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <div className="hidden flex-1 md:block" />

            <DashboardTopbar userName={userName} userEmail={userEmail} role={role} />
          </div>
        </div>

        {/* Page content */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="container-gsd min-w-0 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
