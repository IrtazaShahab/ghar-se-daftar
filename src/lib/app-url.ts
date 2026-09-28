import { headers } from "next/headers";

const LOCAL_APP_URL = "http://localhost:3000";
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

export class AppUrlConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppUrlConfigError";
  }
}

function toOrigin(value: string) {
  const url = new URL(value.includes("://") ? value : `https://${value}`);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppUrlConfigError("App URL must use http or https");
  }
  return url.origin;
}

function isLoopback(hostname: string) {
  return LOOPBACK_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost");
}

/**
 * Canonical application origin used for authentication redirects.
 * Order: NEXT_PUBLIC_APP_URL → Vercel system URLs → localhost (development only).
 * Production never silently falls back to localhost.
 */
export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercelUrl = process.env.VERCEL_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL;

  try {
    if (configuredUrl) return toOrigin(configuredUrl);
    if (vercelUrl) return toOrigin(vercelUrl);
  } catch {
    throw new AppUrlConfigError("NEXT_PUBLIC_APP_URL must be an absolute http(s) URL");
  }

  if (process.env.NODE_ENV !== "production") return LOCAL_APP_URL;

  throw new AppUrlConfigError("NEXT_PUBLIC_APP_URL is not configured for this production deployment");
}

/**
 * Builds the absolute /auth/callback URL placed in Supabase emails. Refuses to
 * emit a loopback origin while serving a real host, which is how production
 * emails previously ended up pointing at http://localhost:3000.
 */
export async function getAuthCallbackUrl(next: string) {
  const appUrl = new URL(getAppUrl());
  const requestHeaders = await headers();
  const requestHost = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "")
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "");

  if (isLoopback(appUrl.hostname) && requestHost && !isLoopback(requestHost)) {
    throw new AppUrlConfigError("NEXT_PUBLIC_APP_URL points to localhost on a non-local host");
  }

  const callbackUrl = new URL("/auth/callback", appUrl);
  callbackUrl.searchParams.set("next", sanitizeRedirectPath(next, "/"));
  return callbackUrl.toString();
}

/**
 * Allows only same-origin, absolute-path redirects (blocks `//evil.com`,
 * `/\evil.com`, `https://…` and similar open-redirect payloads).
 */
export function sanitizeRedirectPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const base = "http://internal.invalid";
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}` : fallback;
  } catch {
    return fallback;
  }
}
