# Ghar Se Daftar authentication emails

The app uses Supabase Auth for every authentication email. Supabase generates
and validates every token; the templates in `supabase/templates/` only decide
how the email looks and which app URL the token is sent to.

Emails are delivered through custom SMTP configured in the Supabase Dashboard
(Gmail SMTP, sender **Ghar Se Daftar** `<gharsedaftar.support@gmail.com>`).
SMTP credentials live only in the Dashboard and must never be committed or put
in `NEXT_PUBLIC_*` variables.

> Editing files in `supabase/templates/` does **not** change the hosted project.
> `supabase/config.toml` only applies to a local Supabase CLI stack. For the
> hosted project, paste each subject and HTML into the Dashboard (see below).

## Templates

| Dashboard template | File | Subject | Used by the app |
| --- | --- | --- | --- |
| Confirm signup | `confirmation.html` | Confirm your Ghar Se Daftar email | Yes: `/signup` |
| Reset password | `recovery.html` | Reset your Ghar Se Daftar password | Yes: `/forgot-password` |
| Change email address | `email-change.html` | Confirm your new Ghar Se Daftar email address | No UI yet (Dashboard/API only) |
| Invite user | `invite.html` | You've been invited to Ghar Se Daftar | Only via Dashboard "Invite user" |
| Password changed (security notification) | `password-changed.html` | Your Ghar Se Daftar password was changed | Yes: after a password reset |
| Email address changed (security notification) | `email-changed.html` | Your Ghar Se Daftar email address was changed | After any email change |

`magic-link.html` and `reauthentication.html` are kept from earlier work but are
not used: the app never calls `signInWithOtp` or `reauthenticate`. They were
intentionally not redesigned. Leave the hosted versions at their defaults unless
those features are added.

There is no login-alert email and no welcome email. Supabase SMTP templates only
cover auth events; see "Adding a welcome email later".

## How the links work

All templates share one layout: table-based, inline styles, 600px card, brand
text next to the logo (so the brand is visible when images are blocked), one
dark green (`#214f32`, the site's `--primary`) call to action, a copy-paste
fallback link and the support address.

The logo is `public/email/logo.png` (PNG, because Gmail does not render SVG),
loaded from `{{ .SiteURL }}/email/logo.png`. It must be deployed; if it is
missing, the green logo tile and brand text still render.

**Confirm signup and Reset password** use the redirect URL the app sends
(`emailRedirectTo` / `redirectTo` from `getAuthCallbackUrl()` in
`src/lib/app-url.ts`), which looks like
`<NEXT_PUBLIC_APP_URL>/auth/callback?next=%2Freset-password`. The template adds
`&token_hash={{ .TokenHash }}&type=recovery` (or `type=email` for signup). This
makes the email environment-aware: a reset requested from localhost opens
localhost, and one requested in production opens production.

If Supabase rejects the redirect (it is not on the allow-list), it falls back to
the Site URL. The templates detect this (`eq .RedirectTo .SiteURL`) and build
`{{ .SiteURL }}/auth/callback?token_hash=...&type=...` instead, so the link
still works.

**Change email and Invite** are not triggered with an app redirect, so they
always link to `{{ .SiteURL }}/auth/callback?next=/dashboard/customer&token_hash=...`.

`/auth/callback` (`src/app/auth/callback/route.ts`) verifies the token with
`verifyOtp({ token_hash, type })` on the server. This works on any device,
unlike the default PKCE `{{ .ConfirmationURL }}` link. For recovery it sets a
15-minute httpOnly marker and redirects to `/reset-password`, which removes the
token from the address bar.

## Hosted Supabase setup (manual)

1. **Authentication → URL Configuration**
   - Site URL: `https://ghar-se-daftar.vercel.app` (never localhost)
   - Redirect URLs:
     - `https://ghar-se-daftar.vercel.app/auth/callback**`
     - `http://localhost:3000/auth/callback**`
2. **Authentication → Emails → Templates**: for each template in the table,
   set the subject and paste the full contents of the file into the message
   body (source view).
3. **Authentication → Emails → Security notifications** (the tab may be named
   differently in newer Dashboards): enable "Password changed" and "Email
   address changed", then paste their subject and HTML.
4. Keep link/click tracking off for SMTP. Rewritten links break tokens.

## Environment variables

`.env.local` (local, never committed):

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon or publishable key>"
DATABASE_URL="..."
DIRECT_URL="..."
```

Vercel (Production): the same names, with
`NEXT_PUBLIC_APP_URL="https://ghar-se-daftar.vercel.app"`.

Local development talks to the **hosted** Supabase project when
`NEXT_PUBLIC_SUPABASE_URL` points at `*.supabase.co`, so local emails use the
hosted templates and Gmail SMTP. `supabase/config.toml` only matters if you run
`supabase start`. That stack uses its own Inbucket/Mailpit inbox, not Gmail.

When `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing,
`createSupabaseServerClient()` throws `SupabaseConfigError`. In development,
Forgot Password shows that message and the server console logs
`name`/`code`/`status`/`message`. Passwords and tokens are never logged, and
email addresses are redacted.

## Testing

Links are single-use and expire, so request a fresh email for every test.

- **Confirm signup**: sign up at `/signup` with a new inbox. Check the From
  name, logo, subject and button. The link should land on `/dashboard/customer`.
  Clicking it a second time should land on `/login?error=invalid_or_expired_confirmation`.
- **Forgot password**: submit `/forgot-password`, then click **Reset Password**.
  You should land on `/reset-password` with the form, set a new password, then
  log in with it. The "password changed" notice should arrive if it is enabled.
  Reusing the link shows the invalid-link state.
- **Locally**: run with `.env.local` as above. The email's link should start with
  `http://localhost:3000/auth/callback`. If it starts with the production URL
  instead, `http://localhost:3000/auth/callback**` is missing from the
  Redirect URLs.
- **Production**: repeat on `https://ghar-se-daftar.vercel.app`. The link should
  start with the production origin.
- Check Gmail web and mobile, Outlook, and Apple Mail with images on and off.

## Adding a welcome email later

A welcome email is an application email, not an auth email, so Supabase SMTP
templates cannot send it. The simplest route is to send it from `/auth/callback`
after a successful `type=email` verification, using a provider API such as
Resend or Postmark (server-only API key). Record a `welcomeEmailSentAt` column
on the user so it is sent once. A Supabase Database Webhook or Auth Hook calling
an Edge Function also works if you want it outside the Next.js app.
