"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Optimized Lenis config for better performance
    const lenis = new Lenis({
      duration: 0.6, // Reduced from 1.2s for snappier feel
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false, // Disable for better mobile performance
      touchMultiplier: 1, // Reduced from 2
      lerp: 0.1, // Linear interpolation factor
      wheelMultiplier: 1,
      infinite: false,
      gestureOrientation: "vertical" as const,
    } as any);

    let rafId: number;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
