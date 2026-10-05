import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CookieOption {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export class SupabaseConfigError extends Error {
  constructor(missing: string[]) {
    super(`Missing ${missing.join(", ")}. Add ${missing.length > 1 ? "them" : "it"} to .env.local (local) or the deployment environment, then restart the server.`);
    this.name = "SupabaseConfigError";
  }
}

/**
 * The browser-safe key: Supabase's newer "publishable" key, or the legacy anon
 * key. Never the service-role key.
 */
export function getSupabasePublicKey() {
  return (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = getSupabasePublicKey();
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) throw new SupabaseConfigError(missing);
  return { url: url!, anonKey: anonKey! };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieOption[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as any);
          });
        } catch {
          // Server Components cannot always set cookies. Middleware handles refresh flows.
        }
      }
    }
  });
}
