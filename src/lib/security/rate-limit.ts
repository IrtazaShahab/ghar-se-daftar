// In production, put Cloudflare rate limiting in front of the app.
// This tiny in-memory limiter is only a development fallback and does not work across serverless instances.

type Record = { count: number; resetAt: number };
const store = new Map<string, Record>();

export function devRateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.count >= limit) return { ok: false, remaining: 0 };
  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}
