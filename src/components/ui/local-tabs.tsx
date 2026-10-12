"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LocalTab = { key: string; label: string; count?: number; content: ReactNode };

/**
 * Tabs whose panels are already rendered on the server: switching is instant
 * and makes no request. The active tab is mirrored into `?param=` with
 * history.replaceState so the URL stays shareable and survives a reload.
 * Inactive panels stay mounted (hidden) so their state is kept.
 */
export function LocalTabs({ tabs, initial, param = "tab", label }: { tabs: LocalTab[]; initial: string; param?: string; label: string }) {
  const [chosen, setActive] = useState(initial);
  // Keeps the user's choice across server refreshes; falls back if that tab disappears.
  const active = tabs.some((tab) => tab.key === chosen) ? chosen : (tabs[0]?.key ?? initial);

  const select = (key: string) => {
    setActive(key);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(param, key);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // URL sync is a convenience only.
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div role="tablist" aria-label={label} className="menu-tabs-scroll -mx-1 overflow-x-auto px-1">
        <div className="flex w-max min-w-full gap-2 rounded-[22px] border border-border/80 bg-white/55 p-2 sm:min-w-0">
          {tabs.map((tab) => {
            const selected = tab.key === active;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.key}`}
                onClick={() => select(tab.key)}
                className={cn(
                  "focus-ring inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold transition",
                  selected ? "bg-primary text-white shadow-lg shadow-primary/15" : "text-primary/75 hover:bg-white"
                )}
              >
                {tab.label}
                {typeof tab.count === "number" ? (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", selected ? "bg-white/20" : "bg-primary/10")}>{tab.count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((tab) => (
        <div key={tab.key} role="tabpanel" id={`panel-${tab.key}`} aria-labelledby={`tab-${tab.key}`} hidden={tab.key !== active} className="min-w-0">
          {tab.content}
        </div>
      ))}
    </div>
  );
}
