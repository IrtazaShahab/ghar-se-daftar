-- Ghar Se Daftar: Row Level Security, role helpers and integrity triggers.
--
-- Safe to re-run (every statement is idempotent). Run after
-- 20260929120000_order_platform_schema.sql (or `npx prisma db push`).
--
-- How access works:
-- * The Next.js server talks to Postgres through Prisma as the table owner, so
--   these policies do not restrict it. Server code enforces roles itself
--   (src/lib/auth/guards.ts) before every read and write.
-- * Anything reaching these tables through the Supabase Data API
--   (publishable/anon key + a user JWT) is limited by the policies below. With RLS
--   enabled and no matching policy, access is denied, so tables that should never
--   be reached from a browser simply have no policy.
-- * Browsers get read access only. All writes go through the server.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so policies can read "User" without recursion)
-- ---------------------------------------------------------------------------

create or replace function private.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.role::text
  from public."User" u
  where u.id = (select auth.uid())::text
    and u.status = 'ACTIVE'
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_app_role() = 'ADMIN', false)
$$;

create or replace function private.current_chef_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select hc.id
  from public."HomeChef" hc
  join public."User" u on u.id = hc."userId"
  where hc."userId" = (select auth.uid())::text
    and hc."isActive"
    and u.role = 'HOME_CHEF'
    and u.status = 'ACTIVE'
$$;

-- Customers see their own orders, chefs see orders assigned to them, admins see all.
create or replace function private.can_view_order(target_order_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public."Order" o
    where o.id = target_order_id
      and (
        private.is_admin()
        or o."userId" = (select auth.uid())::text
        or (o."homeChefId" is not null and o."homeChefId" = private.current_chef_id())
      )
  )
$$;

-- Payment rows are for the paying customer and admins, never chefs.
create or replace function private.can_view_order_payments(target_order_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public."Order" o
    where o.id = target_order_id
      and (private.is_admin() or o."userId" = (select auth.uid())::text)
  )
$$;

revoke all on function private.current_app_role() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.current_chef_id() from public;
revoke all on function private.can_view_order(text) from public;
revoke all on function private.can_view_order_payments(text) from public;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_chef_id() to authenticated;
grant execute on function private.can_view_order(text) to authenticated;
grant execute on function private.can_view_order_payments(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on every application table
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'User', 'Profile', 'Address', 'Company', 'CompanyEmployee', 'HomeChef', 'Kitchen',
    'MenuWeek', 'MenuDay', 'MenuOption', 'Subscription', 'SubscriptionItem',
    'Order', 'OrderItem', 'Payment', 'PaymentEvent', 'OrderStatusHistory',
    'ChefAssignment', 'Notification', 'CorporateRequest', 'CorporateQuote',
    'Invoice', 'DeliveryZone', 'Delivery', 'Complaint', 'AuditLog'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  if to_regclass('public._prisma_migrations') is not null then
    execute 'alter table public._prisma_migrations enable row level security';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- Users: read own row; admins read all. No API writes (roles cannot be self-assigned).
drop policy if exists "user_select_own_or_admin" on public."User";
create policy "user_select_own_or_admin" on public."User"
  for select to authenticated
  using (id = (select auth.uid())::text or private.is_admin());

-- Profiles: read own; admins read all.
drop policy if exists "profile_select_own_or_admin" on public."Profile";
create policy "profile_select_own_or_admin" on public."Profile"
  for select to authenticated
  using ("userId" = (select auth.uid())::text or private.is_admin());

-- Addresses: read own; admins read all.
drop policy if exists "address_select_own_or_admin" on public."Address";
create policy "address_select_own_or_admin" on public."Address"
  for select to authenticated
  using ("userId" = (select auth.uid())::text or private.is_admin());

-- Orders: owner, assigned chef or admin.
drop policy if exists "order_select_visible" on public."Order";
create policy "order_select_visible" on public."Order"
  for select to authenticated
  using (
    private.is_admin()
    or "userId" = (select auth.uid())::text
    or ("homeChefId" is not null and "homeChefId" = private.current_chef_id())
  );

drop policy if exists "order_item_select_visible" on public."OrderItem";
create policy "order_item_select_visible" on public."OrderItem"
  for select to authenticated
  using (private.can_view_order("orderId"));

drop policy if exists "order_status_history_select_visible" on public."OrderStatusHistory";
create policy "order_status_history_select_visible" on public."OrderStatusHistory"
  for select to authenticated
  using (private.can_view_order("orderId"));

-- Payments: paying customer or admin (chefs only see the COD amount on the order).
drop policy if exists "payment_select_owner_or_admin" on public."Payment";
create policy "payment_select_owner_or_admin" on public."Payment"
  for select to authenticated
  using (
    private.is_admin()
    or "userId" = (select auth.uid())::text
    or ("orderId" is not null and private.can_view_order_payments("orderId"))
  );

-- Chef assignments: the assigned chef or admin.
drop policy if exists "chef_assignment_select_own_or_admin" on public."ChefAssignment";
create policy "chef_assignment_select_own_or_admin" on public."ChefAssignment"
  for select to authenticated
  using (private.is_admin() or "homeChefId" = private.current_chef_id());

-- Chef and kitchen records: the chef themselves or admin.
drop policy if exists "home_chef_select_own_or_admin" on public."HomeChef";
create policy "home_chef_select_own_or_admin" on public."HomeChef"
  for select to authenticated
  using (private.is_admin() or "userId" = (select auth.uid())::text);

drop policy if exists "kitchen_select_own_or_admin" on public."Kitchen";
create policy "kitchen_select_own_or_admin" on public."Kitchen"
  for select to authenticated
  using (private.is_admin() or "homeChefId" = private.current_chef_id());

-- Notifications: recipient or admin.
drop policy if exists "notification_select_own_or_admin" on public."Notification";
create policy "notification_select_own_or_admin" on public."Notification"
  for select to authenticated
  using ("userId" = (select auth.uid())::text or private.is_admin());

-- Corporate: the signed-in requester or admin. Quote links are served by the
-- server using an unguessable token, not through the Data API.
drop policy if exists "corporate_request_select_own_or_admin" on public."CorporateRequest";
create policy "corporate_request_select_own_or_admin" on public."CorporateRequest"
  for select to authenticated
  using ("userId" = (select auth.uid())::text or private.is_admin());

drop policy if exists "corporate_quote_select_admin" on public."CorporateQuote";
create policy "corporate_quote_select_admin" on public."CorporateQuote"
  for select to authenticated
  using (private.is_admin());

-- Subscriptions (existing feature): owner or admin.
drop policy if exists "subscription_select_own_or_admin" on public."Subscription";
create policy "subscription_select_own_or_admin" on public."Subscription"
  for select to authenticated
  using ("userId" = (select auth.uid())::text or private.is_admin());

-- Public catalogue: anyone may read the menu and delivery zones.
drop policy if exists "menu_week_public_read" on public."MenuWeek";
create policy "menu_week_public_read" on public."MenuWeek"
  for select to anon, authenticated using (true);

drop policy if exists "menu_day_public_read" on public."MenuDay";
create policy "menu_day_public_read" on public."MenuDay"
  for select to anon, authenticated using (true);

drop policy if exists "menu_option_public_read" on public."MenuOption";
create policy "menu_option_public_read" on public."MenuOption"
  for select to anon, authenticated using (true);

drop policy if exists "delivery_zone_public_read" on public."DeliveryZone";
create policy "delivery_zone_public_read" on public."DeliveryZone"
  for select to anon, authenticated using ("isActive");

-- Admin-only reads.
drop policy if exists "audit_log_select_admin" on public."AuditLog";
create policy "audit_log_select_admin" on public."AuditLog"
  for select to authenticated using (private.is_admin());

drop policy if exists "payment_event_select_admin" on public."PaymentEvent";
create policy "payment_event_select_admin" on public."PaymentEvent"
  for select to authenticated using (private.is_admin());

-- Company, CompanyEmployee, SubscriptionItem, Invoice, Delivery and Complaint have
-- RLS enabled and no policy: they are reachable only from the server.

-- ---------------------------------------------------------------------------
-- Integrity triggers (these also apply to the server's Prisma connection)
-- ---------------------------------------------------------------------------

-- Nobody can change a role or account status through the Data API unless they
-- are an admin. Direct server/SQL-editor connections have no JWT (auth.uid() is
-- null) and are allowed, which is how the first admin is created.
create or replace function private.guard_user_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and (select auth.uid()) is not null
     and not private.is_admin() then
    raise exception 'Only administrators can change account roles or status'
      using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists guard_user_privileges on public."User";
create trigger guard_user_privileges
  before update on public."User"
  for each row execute function private.guard_user_privileges();

-- Orders move forward through the lifecycle only (or to CANCELLED before
-- delivery). Mirrors ORDER_TRANSITIONS in src/lib/orders/status.ts.
create or replace function private.guard_order_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if not (
    (old.status = 'PENDING' and new.status in ('CONFIRMED', 'CANCELLED'))
    or (old.status = 'CONFIRMED' and new.status in ('PREPARING', 'CANCELLED'))
    or (old.status = 'PREPARING' and new.status in ('READY', 'CANCELLED'))
    or (old.status = 'READY' and new.status in ('OUT_FOR_DELIVERY', 'CANCELLED'))
    or (old.status = 'OUT_FOR_DELIVERY' and new.status in ('DELIVERED', 'CANCELLED'))
  ) then
    raise exception 'Invalid order status transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  return new;
end
$$;

drop trigger if exists guard_order_status_transition on public."Order";
create trigger guard_order_status_transition
  before update of status on public."Order"
  for each row execute function private.guard_order_status_transition();

-- Amounts can never be negative and totals must add up.
alter table public."Order" drop constraint if exists order_amounts_valid;
alter table public."Order" add constraint order_amounts_valid check (
  "subtotal" >= 0
  and "deliveryFee" >= 0
  and "discount" >= 0
  and "totalAmount" = "subtotal" + "deliveryFee" - "discount"
) not valid;

alter table public."OrderItem" drop constraint if exists order_item_amounts_valid;
alter table public."OrderItem" add constraint order_item_amounts_valid check (
  "quantity" > 0 and "unitPrice" >= 0 and "lineTotal" = "unitPrice" * "quantity"
) not valid;

alter table public."Payment" drop constraint if exists payment_amount_valid;
alter table public."Payment" add constraint payment_amount_valid check ("amount" >= 0) not valid;
