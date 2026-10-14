# Performance notes

## The main cost: database round trips

Measured from a development laptop in Pakistan to the Supabase pooler in
`ap-northeast-1` (Tokyo):

| Connection | Time per query |
| --- | --- |
| Transaction pooler (port 6543, `pgbouncer=true`), as used at runtime | ~1.0–1.15 s |
| Session pooler (port 5432) | ~0.2 s |
| Supabase Auth HTTP call (`getUser`) | ~0.23 s |

In transaction-pooler mode Prisma 5 can't reuse prepared statements, so each
query costs several network round trips. Everything that makes the app feel
fast comes down to **fewer round trips per click**:

- `relationJoins` (schema.prisma): an `include` is one SQL statement instead
  of one per relation. `getCurrentUser` 3 → 1, chef order list 6 → 1, admin
  order detail 10 → 1.
- Sessions are verified locally with `getClaims()` (ES256 keys, cached 10 min)
  instead of an Auth network call in middleware **and** again in the page.
- Server actions call `revalidatePath`, which already returns the refreshed
  page; buttons no longer call `router.refresh()` as well (that rendered every
  page twice per click).
- Audit and notification writes run after the response (`runAfter`).
- Chef, rider and admin delivery boards load all tabs in one query; switching
  tabs is local.
- Delivery windows are cached across requests.
- The marketing nav asks "who is signed in" once per session, not on every page.

## Recommendations (not changed automatically)

1. **Put the server next to the database.** On Vercel, set the functions region
   to Tokyo (`hnd1`) while the database is in `ap-northeast-1`, or move both
   closer to customers (e.g. Mumbai). A cross-continent hop multiplies every
   query above.
2. **Local development:** point `DATABASE_URL` in `.env.local` at the session
   pooler (port 5432) instead of 6543. That is roughly 4–5× faster per query
   here; `connection_limit=5` stays under the pooler cap.
3. Production uses `connection_limit=1`, so the `Promise.all` queries in a page
   run one after another. Raising it to 2–3 on the transaction pooler would let
   them overlap; test under load first.

## UX rules used in the dashboards

- Every route has a `loading.tsx` skeleton shaped like the page.
- Sidebar links highlight with a spinner the moment they're clicked
  (`useLinkStatus`).
- Status buttons update the badge optimistically (`OptimisticStatusProvider`),
  show a pending label, and roll back with an inline error and *Try again* if
  the server refuses.
- Maps and other heavy widgets are loaded with `next/dynamic` only when shown.
