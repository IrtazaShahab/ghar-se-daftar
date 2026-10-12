# Ghar Se Daftar

Premium homemade meal subscription platform for Pakistani office professionals.

**Brand line:** Ghar Ka Khana, Ab Daftar Tak.

This starter project includes:

- Next.js App Router structure
- TypeScript
- Tailwind CSS design system
- Framer Motion-ready animated components
- Supabase/Auth.js placeholders
- Prisma PostgreSQL schema
- Landing page sections
- Customer, Corporate, Admin, and Home Chef dashboard concepts
- Menu management pages
- Subscription and corporate order flows
- Security-first middleware and route conventions
- Codex implementation prompt

## Recommended Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style local UI primitives
- Framer Motion
- Prisma ORM
- Supabase PostgreSQL
- Supabase Auth or Auth.js
- Cloudflare WAF/rate limiting in production

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run dev
```

Open `http://localhost:3100`.

## Database Setup

Use Supabase PostgreSQL for MVP/production. Add the connection string to:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Then apply the SQL migrations in `supabase/migrations/` and seed the menu:

```bash
npx prisma generate
npm run seed
```

See [`docs/ORDER_PLATFORM.md`](docs/ORDER_PLATFORM.md) for the full setup
(migrations, first admin, chefs, email, payments and local testing),
[`docs/DELIVERY_AND_RIDERS.md`](docs/DELIVERY_AND_RIDERS.md) for riders, live
tracking, Google Maps and delivery windows,
[`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) for what makes pages fast (and what
slows them down), and [`docs/SUPABASE_AUTH_EMAILS.md`](docs/SUPABASE_AUTH_EMAILS.md)
for auth emails.

Tests: `npm test` (unit). The delivery-flow integration test runs against a
local database only: `TEST_DATABASE_URL=postgresql://postgres@localhost:PORT/db npm test`.

## Important Production Notes

1. Do not treat this scaffold as production-secure until auth, payments, webhook verification, RBAC, rate limiting, CSP, monitoring, backups, and audit logs are fully configured.
2. Keep public marketing pages cached and dashboard pages dynamic.
3. Use Cloudflare in front of production for WAF, bot protection, and rate limiting.
4. Enable Supabase backups/PITR on paid production plans.
5. Use admin MFA and role-based access checks on every dashboard route.

## Codex Prompt

See [`docs/CODEX_PROMPT.md`](docs/CODEX_PROMPT.md).
