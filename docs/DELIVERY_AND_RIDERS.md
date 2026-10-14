# Delivery, riders and live tracking

How an order gets from the kitchen to the customer, who can see what, and how
to set it up.

## Flow

```
Chef marks Ready ─► Admin assigns rider ─► Rider accepts ─► Rider picks up
                    (Admin → Deliveries      (/rider)          = order Out for delivery
                     or the order page)                         │
                                                                ▼
                     Customer sees rider, ETA, map ◄── Rider shares live location (opt-in)
                                                                │
                                                                ▼
                                       Rider marks Delivered (+ "cash collected" for COD)
```

- A rider can be assigned once the order is **Confirmed** (so they can plan
  ahead) and reassigned until they pick it up.
- **Pickup** moves the order from Ready to Out for delivery; **Delivered** ends
  it. Riders can do nothing else. The database trigger still rejects any
  invalid lifecycle jump.
- Admins can still move orders manually (e.g. when no rider is used); the rider's
  delivery record follows whatever happens to the order.
- COD: the rider confirms "cash collected" on delivery, which records the
  payment (recorded by the rider's account). "Cash not collected" leaves it
  pending for the team to follow up.

## Roles and data

| Who | Sees |
| --- | --- |
| **Customer** | Their own order only. Rider name and **Call rider** only while Out for delivery. Live position only when the rider is sharing and the point is fresh (< 2 min). Otherwise: "Live rider location is currently unavailable." with the age of the last update. Nothing about the rider after delivery except their name. |
| **Rider** | Only deliveries assigned to them. Customer first name, address/pin and instructions while the delivery is active (area only afterwards). Customer phone **only after pickup**. Kitchen pickup address and chef phone before pickup. COD amount to collect. |
| **Chef** | For their own orders: the rider's name and whether the order was picked up. No rider phone, no map. |
| **Admin** | Everything: rider, status, live or last known position (stale flagged), ETA, issues, contact buttons. |

These rules are applied on the server (`src/lib/delivery/queries.ts`), so the
data never reaches a browser that shouldn't have it. Rider identity is always
taken from the session (`requireRiderActor`); a rider id from the browser is
never trusted.

## Live location: design

- **Consent per delivery.** Sharing starts only when the rider taps *Share live
  location* after pickup and the browser grants permission. The server records
  `sharingStartedAt`; points are refused unless the delivery is the rider's own,
  picked up, Out for delivery and sharing.
- **Only the latest point is stored** (`Delivery.lastLatitude/…/lastLocationAt`),
  never a trail. It is **deleted** when the order is delivered or cancelled, or
  the rider taps *Stop sharing*.
- **Cadence.** The rider's phone sends a point when it has moved ≥ 30 m and
  ≥ 15 s have passed, or every 60 s as a heartbeat while standing still. The
  server ignores points < 8 s apart and readings worse than 1 km accuracy.
  Typically 2–4 writes per minute per active rider, never one per second.
  Constants: `src/lib/delivery/geo.ts`.
- **Stale means stale.** Points older than 2 minutes are not shown to the
  customer as live; they see the age instead.
- **Transport: polling, not Supabase Realtime (yet).** The tracking page polls
  `GET /api/tracking/[orderNumber]` every 15 s while the order is on its way;
  the rider app posts to `POST /api/rider/location`. Because points arrive at
  most every ~15 s, Realtime would not make the map noticeably fresher, while it
  would require exposing the `Delivery` table through the Data API with new RLS
  policies and a publication change. Polling keeps every read behind the same
  server-side role checks as the rest of the app. Realtime Broadcast can be
  added later without schema changes if needed.
- **ETA** is an estimate from the rider's last fresh point to the customer's
  map pin (straight-line distance × 1.35 road factor at 20 km/h, shown as a
  range). Orders without a map pin show "Not available".
- **Failure handling.** Permission refused → the rider sees why and can still
  deliver; the customer sees status without a map. Lost connection → the rider
  app keeps watching and sends the newest point when back. Maps failing → plain
  "Open in Google Maps" links. A failed poll keeps the last known status.

## Delivery windows

Configurable in **Admin → Delivery settings** (table `ServiceWindow`). Defaults
seeded by the migration:

| Window | Time | Slots | Same-day orders close |
| --- | --- | --- | --- |
| Lunch | 12:00–16:00 | hourly | 10:30 AM (the existing cutoff) |
| Late lunch | 16:00–18:00 | hourly | 2:00 PM |
| Dinner | 18:00–21:00 | hourly | 4:00 PM |

Each menu item is delivered on its menu day. Checkout offers only slots that
can still be served for the order's first delivery day; if every window for
today has closed, today's items move to next week. The server re-checks the
slot when the order is placed. Slot lists are cached across requests and
refreshed immediately when an admin saves a window. Kitchen hours are the
union of active windows (the kitchen isn't known until an admin assigns it).

## Setup

1. **Migration** (not applied automatically; back up first):
   `supabase/migrations/20261006120000_delivery_riders_service_windows.sql`.
   Additive and idempotent: new enum values `RIDER` (UserRole,
   NotificationAudience), enum `DeliveryStatus`, nullable columns on `Order`
   (map pin), `Kitchen` (pickup address) and `Delivery` (rider, status,
   timestamps, issue, live location), new tables `Rider` and `ServiceWindow`
   (RLS on, no policies: server-only), check constraints, default windows.
   Existing orders are untouched. Rollback (data-destroying, manual):
   `supabase/rollbacks/20261006120000_delivery_riders_service_windows.down.sql`.
   The app code needs this migration: deploy it **before** the new code.
2. **Riders:** the rider signs up at `/signup`, then an admin adds them in
   **Admin → Riders** (email, name shown to customers, phone).
3. **Pickup addresses:** add one per kitchen in **Admin → Chefs & kitchens**.
4. **Google Maps (optional):** see below.

### Google Cloud configuration

The app only uses Google from the browser (no server key exists). A browser
key is always visible in page source; what protects it is the restrictions
below plus quotas. Use **two keys** so a leaked development key can't be used
on production traffic and vice versa:

| Key | Application restriction (Websites / HTTP referrers) | Goes in |
| --- | --- | --- |
| Production | `https://YOUR-DOMAIN/*` and `https://www.YOUR-DOMAIN/*` (each production domain, exactly) | Vercel → Environment Variables → **Production**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Development | `http://localhost:3100/*` (and `http://127.0.0.1:3100/*` if you use it) | `.env.local`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |

- **Never** allow `https://*.vercel.app/*`: that pattern matches every site
  hosted on Vercel, not just yours. For Preview deployments either leave the
  variable unset (checkout falls back to typed addresses) or add the exact
  preview hostname you use (e.g. a stable branch alias) to the development key.
- **API restrictions (both keys):** *Restrict key* → only **Maps JavaScript
  API** and **Places API (New)**. Enable those two APIs in the project. Nothing
  else is called: no Geocoding, Directions or Distance Matrix (the rider's
  "Directions" button is a plain google.com/maps link, no key).
- **Map ID (optional, recommended for production):** Google Maps Platform →
  Map management → create a *JavaScript* map ID, set
  `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` in the same places. Without it the app uses
  `DEMO_MAP_ID`, which is meant for development only.
- **Quotas:** set per-day request caps on both APIs and a billing budget alert.
  Autocomplete uses session tokens (one billed session per address chosen).
- `NEXT_PUBLIC_*` values are compiled into the build: after changing them in
  Vercel, redeploy.

Without a key everything still works with typed addresses; the map pin and
tracking map are simply not offered.
