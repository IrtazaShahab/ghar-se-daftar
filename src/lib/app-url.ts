const LOCAL_APP_URL = "http://localhost:3000";

/**
 * Canonical application origin used for authentication redirects.
 * NEXT_PUBLIC_APP_URL must be an absolute http(s) URL and should be HTTPS in production.
 */
export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || LOCAL_APP_URL;

  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    return url.origin;
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be an absolute http(s) URL");
  }
}

export function getAuthCallbackUrl(next: string) {
  const callbackUrl = new URL("/auth/callback", getAppUrl());
  callbackUrl.searchParams.set("next", next);
  return callbackUrl.toString();
}
