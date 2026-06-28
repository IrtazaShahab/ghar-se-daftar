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

Open `http://localhost:3000`.

## Database Setup

Use Supabase PostgreSQL for MVP/production. Add the connection string to:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Then run:

```bash
npm run db:migrate
npm run seed
```

## Important Production Notes

1. Do not treat this scaffold as production-secure until auth, payments, webhook verification, RBAC, rate limiting, CSP, monitoring, backups, and audit logs are fully configured.
2. Keep public marketing pages cached and dashboard pages dynamic.
3. Use Cloudflare in front of production for WAF, bot protection, and rate limiting.
4. Enable Supabase backups/PITR on paid production plans.
5. Use admin MFA and role-based access checks on every dashboard route.

## Codex Prompt

See [`docs/CODEX_PROMPT.md`](docs/CODEX_PROMPT.md).
