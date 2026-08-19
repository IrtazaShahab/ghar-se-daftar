# Ghar Se Daftar transactional email setup

The application continues to use Supabase Auth. The HTML in `supabase/templates/`
uses Supabase's official `{{ .TokenHash }}` and `{{ .RedirectTo }}` variables.
Supabase still generates and validates every token; the visible link uses the
Ghar Se Daftar application domain and the callback verifies it server-side.

The templates reuse the existing brand mark at `/favicon.svg` and production
palette. They use table layouts, inline styles, mobile media queries, large tap
targets, and text brand identification when images are blocked. The recovery
message clearly separates account security from its subtle menu promotion.

## Implemented flows

| Flow | Template |
| --- | --- |
| Signup confirmation | `confirmation.html` |
| Password recovery | `recovery.html` |
| Email change confirmation | `email-change.html` |
| User invitation | `invite.html` |
| Magic-link sign-in | `magic-link.html` |
| Reauthentication code | `reauthentication.html` |

The latter four are ready if enabled in Supabase, although the current UI does
not trigger them. The app does not currently send separate welcome,
password-changed, email-changed, order-status, or payment-receipt messages.
Supabase Auth has no stock post-signup/password-changed template hooks, while
the repository's order/payment actions are placeholders without real status
events. Those messages require a server-side provider and real, idempotent
domain events; static templates alone would misrepresent functionality.

## Hosted Supabase project (required manual configuration)

Repository files do not automatically update a hosted project's Auth settings.

1. Open **Supabase Dashboard > Authentication > URL Configuration**.
2. Set **Site URL** to the production origin (for example,
   `https://gharsedaftar.pk`), never localhost for the production project.
3. Add these **Redirect URLs**:
   - `https://YOUR-PRODUCTION-DOMAIN/auth/callback`
   - `http://localhost:3000/auth/callback` (only when this same project is used
     for local development)
   - Add explicit preview origins only when preview authentication is needed.
4. Open **Authentication > Email Templates** and copy the subject and HTML from:
   - Confirm signup: `confirmation.html`
   - Reset password: `recovery.html`
   - Change email address: `email-change.html`
   - Invite user: `invite.html`
   - Magic link: `magic-link.html`
   - Reauthentication: `reauthentication.html`
5. In **Project Settings > Authentication > SMTP Settings** (the Dashboard label
   may appear as **Authentication > SMTP Settings**), configure production SMTP.
   Use:
   - Sender name: `Ghar Se Daftar`
   - Sender address: a real, verified mailbox such as
     `account@gharsedaftar.pk`
   - Reply-to: `support@gharsedaftar.pk`
   - SMTP host, port, username, and password: the provider-supplied values,
     stored only in the Supabase Dashboard
6. Verify the domain with the provider. Publish its SPF and DKIM records and add
   a DMARC policy for `gharsedaftar.pk`. Start with DMARC monitoring if the
   domain has other senders, then tighten it after reviewing reports.
7. Require SMTP TLS and disable click/link tracking for authentication messages;
   URL rewriting can break token verification.

The visible From identity comes from custom SMTP, not template HTML. Do not
enter an invented or unverified sender address. Until custom SMTP is enabled,
Supabase's default sending identity and its service limits still apply.

The production Site URL must serve `/favicon.svg` over public HTTPS. Some email
clients block remote images or SVG, so every template also includes the brand
name as text and remains understandable without the image.

## Environment variables

Local `.env.local`:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_OR_PUBLISHABLE_KEY"
```

Production uses the same names, but `NEXT_PUBLIC_APP_URL` must be the deployed
HTTPS origin. The Supabase URL and anon/publishable key are designed for browser
use. `SUPABASE_SERVICE_ROLE_KEY`, database credentials, SMTP credentials, and
Supabase access tokens must remain server-only and must never be embedded in
templates or `NEXT_PUBLIC_*` variables.

## Tests

- **Signup:** use a new inbox on `/signup`, inspect the Confirm signup email,
  click **Confirm Email Address**, and verify arrival at `/dashboard/customer`.
- **Password reset:** submit the inbox at `/forgot-password`, click **Reset
  Password**, verify arrival at `/reset-password`, and set a new password.
- **Email change:** this repository currently has no email-change UI. Trigger an
  email update from a trusted test client or Supabase Dashboard test workflow,
  then confirm the message uses the Change email address template. Do not add an
  account email-change UI without also synchronizing the Prisma user email.

Test local and production URLs separately. A redirect not on Supabase's allow
list falls back to the configured Site URL. Do not use broad production wildcard
redirects. Request a fresh email for each test because confirmation links are
single-use and expire.

Also test Gmail and Outlook plus Apple Mail/iPhone when available. Check the
displayed From identity, preheader, image-disabled fallback, 320 px layout, CTA,
raw fallback URL, expected landing route, single-use behavior, and expired-link
error page. For client screenshot testing, substitute non-sensitive example
values in Litmus or Email on Acid; never paste a live token.

## Production deployment

1. Deploy the app with `NEXT_PUBLIC_APP_URL` set to its canonical HTTPS origin.
2. Configure the Site URL and exact callback allow-list entries in Supabase.
3. Copy all six repository subjects and templates into the hosted project's
   Auth Email Templates screen; local files do not update hosted Supabase.
4. Configure verified custom SMTP, DNS authentication, From, and reply-to.
5. Turn off link tracking and run signup and password-recovery tests.
6. Add non-Auth transactional templates only after real persisted order/payment
   events exist, with idempotency and delivery logging.
