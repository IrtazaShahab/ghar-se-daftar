"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches server data periodically while the tab is visible (order tracking, kitchen boards). */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, router]);

  return null;
}
