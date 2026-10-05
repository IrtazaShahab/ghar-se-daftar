# Ordering, payments, kitchen and corporate platform

How ordering works end to end, how to set it up, and how to run it. For auth
emails see [`SUPABASE_AUTH_EMAILS.md`](SUPABASE_AUTH_EMAILS.md).

## How it fits together

- **Supabase Auth** handles sign-up, login and password reset (unchanged).
- **Supabase Postgres** is the source of truth for orders, payments, kitchens and
  corporate requests. The Next.js server reads and writes it through **Prisma**.
- **Authorization is enforced on the server.** Every admin/chef page calls a guard
  from `src/lib/auth/guards.ts`, and every server action checks the role again.
  Hiding links is only a convenience.
- **Row Level Security** is enabled on every table
  (`supabase/migrations/20260929120100_order_platform_security.sql`). It protects the
  same data if anyone queries it through the Supabase Data API with the publishable
  key: customers see only their own rows, chefs only their assigned orders, and
  nobody can change their own role. Prisma connects as the table owner, so RLS
  doesn't restrict server code.
- **Database triggers** reject invalid order-status jumps (e.g. `PENDING → DELIVERED`)
  and role changes by non-admins, even if application code had a bug.

### Order lifecycle

```
PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
   └──────────┴───────────┴─────────┴──────────┴──→ CANCELLED (reason required)
```

| Step | Who |
| --- | --- |
| Confirm, assign chef/kitchen, out for delivery, delivered, cancel | Admin |
| Accept assignment, start preparation (`CONFIRMED → PREPARING`), mark ready | Assigned chef only |

Every change writes an `OrderStatusHistory` row (who, when, note). The rules live
in `src/lib/orders/status.ts` and the SQL trigger mirrors them.

### Pricing (server-side only)

`src/lib/orders/pricing.ts`: subtotal ≥ Rs. 500 → free delivery, otherwise Rs. 100.
`total = subtotal + delivery − discount`. The browser sends only menu item ids and
quantities. Names and prices come from `MenuOption` in the database
(`src/lib/orders/cart.ts`). Discounts are a hook that currently returns 0.

### Payments

| Method | Status today | Becomes `PAID` when |
| --- | --- | --- |
| Cash on Delivery | Live | Admin marks the order delivered with "cash collected", or records it in `/admin/payments` |
| Easypaisa / JazzCash | Coming soon (configuration required) | A verified provider webhook or server-side verification |
| Debit / Credit Card | Coming soon (configuration required) | A verified provider webhook or server-side verification |
| Bank transfer, Invoice (corporate) | Live | Admin records the payment received |

Online payments can never be marked paid by hand, and a browser redirect is never
treated as proof of payment. See [Connecting an online provider](#connecting-an-online-provider).

Payment rules by order type live in `src/lib/payments/policy.ts`. Standard orders
offer Easypaisa/JazzCash, COD and card. Corporate plans never offer COD. Set
`PREPAYMENT_REQUIRED_ABOVE_PKR` to force online payment for large orders.

### Notifications

`src/lib/notifications/`: each email is recorded in `Notification` with a unique
`dedupeKey`, so it is sent once. Customers get emails for order received,
confirmed, out for delivery, delivered, cancelled and payment received. Admins get
an in-app feed on `/admin`, plus email if `ADMIN_NOTIFICATION_EMAILS` is set. When
`EMAIL_PROVIDER` is not configured, emails are recorded as `SKIPPED` and ordering
still works.

## Routes

| Route | Who | Purpose |
| --- | --- | --- |
| `/checkout` | Customer (login required) | Details → delivery → payment → place order |
| `/order/success?order=GSD-…` | Order owner | Confirmation with items, totals, payment, address |
| `/orders/GSD-…` | Order owner | Live tracking (auto-refreshes every 30 s) |
| `/dashboard/customer/orders` | Customer | Order history with status and payment |
| `/admin` | Admin | Today's orders, pipeline counts, revenue, COD to collect, activity |
| `/admin/orders`, `/admin/orders/[id]` | Admin | Search/filter, full detail and all actions |
| `/admin/payments` | Admin | All payment attempts, provider readiness, record offline payments |
| `/admin/customers` | Admin | Customers, order counts, spend |
| `/admin/corporate`, `/admin/corporate/[id]` | Admin | Requests, notes, quotations, corporate payments |
| `/admin/chefs` | Admin | Create chefs from existing accounts, kitchens, activate/deactivate |
| `/chef`, `/chef/orders`, `/chef/orders/[id]` | Chef | Assigned orders only: New / Accepted / Preparing / Ready / Completed |
| `/corporate-order` | Public | Corporate lead form (no payment) |
| `/corporate/quote/<token>` | Company (private link) | Review, accept/decline, choose payment |
| `POST /api/webhooks/payments/<provider>` | Payment provider | Signed webhooks (rejected until the provider is live) |
| `GET /api/payments/return/<provider>` | Customer browser | Re-verifies with the provider, then shows the order |

`/dashboard/admin` and `/dashboard/chef` now redirect to `/admin` and `/chef`.

## Setup

### 1. Environment

Copy the new variable names from `.env.example` into `.env.local` and the
deployment environment. The minimum for ordering is the existing `DATABASE_URL`,
`DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(the code now accepts the publishable key or the legacy anon key).

To send order emails with the same Gmail account Supabase uses:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=gharsedaftar.support@gmail.com
SMTP_PASS=<16-character Gmail App Password>
EMAIL_FROM="Ghar Se Daftar <gharsedaftar.support@gmail.com>"
ADMIN_NOTIFICATION_EMAILS=you@example.com
```

Check it without placing an order (local CLI only, there is no web endpoint):

```bash
npm run email:test -- you@example.com --verify   # SMTP login only
npm run email:test -- you@example.com            # also sends 2 sample emails
```

Every email attempt is stored in the `Notification` table with status `SENT`,
`SKIPPED` (with the missing setting) or `FAILED` (with a reason such as an
authentication failure or a rejected recipient). Server logs show one
`[email] …` line per attempt; passwords are never logged.

### 2. Database migrations

Back up the database first (Supabase → Database → Backups).

**If the app's tables already exist** (the database was set up from the previous
`prisma/schema.prisma`), run these in order in **Supabase → SQL Editor**:

1. `supabase/migrations/20260929120000_order_platform_schema.sql`
2. `supabase/migrations/20260929120100_order_platform_security.sql`

**If the database has none of the app tables yet:** run `npx prisma db push`
(with `DIRECT_URL` set), then run file 2 above.

Then, locally:

```bash
npx prisma generate
npm run seed   # idempotent: menu with stable ids + delivery zones
```

The seed creates menu rows whose ids match `src/data/menu.ts` (e.g.
`menu-monday-a`). Checkout prices come from these rows, so change prices in the
`MenuOption` table (Supabase Table Editor), not in the code. Re-running the seed
never overwrites prices.

Both SQL files were tested on PostgreSQL against the previous schema with
existing rows. Legacy `DRAFT` orders become `PENDING` and receive an order number.

### 3. Create the first admin

Admins can only be created with direct database access. There is no sign-up path
to admin, and the database blocks role changes made through the API.

1. Sign up normally at `/signup` and confirm the email.
2. In **Supabase → SQL Editor**, run:

   ```sql
   update public."User" set role = 'ADMIN' where email = 'you@example.com';
   ```

3. Log out and back in. You land on `/admin`.

To remove admin access later: `update public."User" set role = 'CUSTOMER' where email = '…';`

### 4. Create and assign a chef

1. The chef signs up at `/signup` with their own email and confirms it.
2. Admin → **Chefs & Kitchens** → *Add a chef*: enter that email, display name,
   area and specialty. The account becomes a chef with a first kitchen.
   (Add more kitchens from the chef's card.)
3. Open an order in **Admin → Orders**, confirm it, choose the chef/kitchen under
   *Kitchen & chef* and click **Assign chef**.
4. The chef logs in, lands on `/chef`, accepts the order, starts preparation and
   marks it ready. Admin then marks it out for delivery and delivered.

Deactivating a chef removes their kitchen access and hides them from assignment.

## Testing locally

```bash
npm install
npm run dev
```

Accounts needed: one customer, one admin (step 3), one chef (step 4). Use three
browsers or private windows.

**A. Signup:** `/signup` → confirmation email → click the link → you land on `/`
signed in (account menu visible). No email is sent on later logins.

**B. Returning user:** `/checkout` while logged out → "Log in to continue" →
after login you return to `/checkout`. Plain login → `/` (customers), `/admin`
(admins), `/chef` (chefs).

**C. COD order:** add one Rs. 350 meal → checkout shows Subtotal Rs. 350, Delivery
Rs. 100, Total Rs. 450. Add a second meal → Delivery FREE. Choose Cash on
Delivery → Place Order → confirmation page (Payment: Cash on Delivery, Pending,
amount to collect) → **Track Order**. As admin: the order is on `/admin` → confirm →
assign chef. As chef: accept → start preparation → mark ready. As admin: out for
delivery → *Mark delivered · cash collected* → payment becomes Paid. The customer's
tracking page shows every step.

**D/E. Easypaisa, JazzCash and card:** they appear as "Coming soon" and can't be
selected. `/admin/payments` lists the missing configuration for each. Webhooks
return 503 until a provider is live.

**F. Corporate:** submit `/corporate-order` → reference shown → the request appears
in `/admin/corporate` → open it, set *Contacted*, create a quotation → **Send to
company** (emailed, and the link is shown on the page) → open the link → Accept →
choose Bank transfer → as admin, *Record payment received* → request shows
*Plan active*.

**G. Authorization:** as a customer, open `/admin` or `/chef` → Access denied. As a
chef, `/admin` → Access denied. Open another customer's `/orders/GSD-…` → Order not
found. As another chef, open `/chef/orders/<id>` for an order not assigned to you → 404.

**Double submit:** double-click Place Order. The button disables immediately and
the server's idempotency key returns the same order, so only one is created.

## Connecting an online provider

Everything around the provider is in place: the payment rows, the webhook and
return routes, signature verification, de-duplication of webhook events, and
amount checks. What's missing is the provider-specific API calls, which need
merchant credentials and the provider's documentation.

1. Get merchant/sandbox credentials and the integration guide (Easypaisa,
   JazzCash, or a card gateway).
2. Set the provider's variables (see `.env.example`). Server-only, never `NEXT_PUBLIC_*`.
3. In `src/lib/payments/providers/online.ts`, implement for that provider:
   - `initializePayment` – create the transaction via the provider API and return
     `{ kind: "redirect", redirectUrl, providerReference }` (or `form_post`).
   - `verifyPayment` – query the provider for the transaction's real status.
   - `handleWebhook` – verify the signature over the raw body
     (`assertValidHmacSignature` or the provider's hash scheme) and return the
     event id and verified status.
   - `refundPayment`.
   Then set `implemented: true`.
4. Register the webhook URL with the provider:
   `https://<your-domain>/api/webhooks/payments/<provider-id>`.
5. Test in sandbox: a successful payment turns `PAID` only after the webhook or
   verification; re-sent webhooks are ignored; a wrong amount is marked `FAILED`.

Checkout offers the method automatically once `getStatus()` reports `ready`.
Raw card numbers, CVV, expiry dates and wallet PINs must never reach this app;
customers enter them on the provider's hosted page.
