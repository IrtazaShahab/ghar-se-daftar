# Security Checklist

## Authentication

- Use Supabase Auth or Auth.js.
- Admin accounts require MFA.
- Use HttpOnly, Secure, SameSite cookies.
- Do not store JWTs in localStorage.
- Add rate limiting to login and OTP endpoints.
- Add account lockout or cooldown after repeated attempts.
- Add session/device management.

## Authorization

- Enforce role checks server-side.
- Customer cannot access corporate/admin/chef routes.
- Corporate admin can only access their company data.
- Chef can only view assigned orders.
- Admin actions must be recorded in AuditLog.

## Database

- PostgreSQL with automated backups.
- Enable Supabase RLS if using Supabase client-side access.
- Use Prisma for server-side DB access.
- Add indexes on userId, companyId, status, deliveryDate.
- Never hard-delete payments/orders unless legally required.
- Add soft-delete for sensitive operational records.

## API

- Validate all inputs with Zod.
- Verify webhook signatures.
- Use idempotency keys for payment webhooks.
- Rate limit public forms.
- Sanitize file uploads.
- Log suspicious events.

## Infrastructure

- Cloudflare WAF and bot protection.
- Cloudflare rate limits for login, checkout, forms, and APIs.
- Sentry for errors.
- Uptime monitoring for `/api/health`.
- Daily database backups and point-in-time recovery.
- Use secret manager/environment variables.

## Headers

- CSP
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy
- Permissions-Policy

## Production Must-Haves

- Payment provider verified.
- Food safety policy page.
- Refund/cancellation policy.
- Privacy policy.
- Admin MFA.
- Backup restore test.
- Load test before corporate launch.
