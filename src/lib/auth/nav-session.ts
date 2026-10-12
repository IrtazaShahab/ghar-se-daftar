"use client";

import { getCurrentUser } from "@/app/actions/auth";

type NavUser = Awaited<ReturnType<typeof getCurrentUser>>;

/**
 * The marketing nav only needs "signed in, and as which role". It used to ask
 * the server on every page mount (a server action + database lookup per
 * navigation). Now it asks once per browser session, refreshed after a minute,
 * and is cleared explicitly on login, signup and logout.
 */
const TTL_MS = 60_000;
let cached: { promise: Promise<NavUser>; at: number } | null = null;

export function getNavUser() {
  if (!cached || Date.now() - cached.at > TTL_MS) {
    const promise = getCurrentUser().catch(() => null);
    cached = { promise, at: Date.now() };
  }
  return cached.promise;
}

export function clearNavUser() {
  cached = null;
}
