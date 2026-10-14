/**
 * Server configuration checks. Report variable NAMES only, never values, so the
 * results are safe to log.
 */

const REQUIRED_SERVER_ENV = ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_APP_URL"] as const;

/** Names of required variables that are missing or empty. */
export function getMissingServerEnv() {
  const missing: string[] = REQUIRED_SERVER_ENV.filter((name) => !process.env[name]?.trim());
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!publicKey?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return missing;
}

/**
 * Non-secret warnings about DATABASE_URL's shape on Vercel. Serverless functions
 * should use the Supavisor transaction pooler (port 6543); the direct
 * db.<ref>.supabase.co host is IPv6-only and unreachable from Vercel.
 */
export function getDatabaseUrlWarnings() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw || !process.env.VERCEL) return [];

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return ["DATABASE_URL is not a valid URL"];
  }

  const warnings: string[] = [];
  if (url.hostname.startsWith("db.") && url.hostname.endsWith(".supabase.co")) {
    warnings.push("DATABASE_URL uses the direct database host; use the transaction pooler");
  } else if (url.port !== "6543") {
    warnings.push("DATABASE_URL is not on the transaction pooler port 6543");
  }
  return warnings;
}
