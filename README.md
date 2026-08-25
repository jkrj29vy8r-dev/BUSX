# BUSX

Core database schema and backend API architecture for a multi-tenant passenger
transport platform: N-stop route graphs, per-segment differential pricing, and
concurrency-safe seat inventory shared across overlapping passenger segments.

## Stack

- Next.js (App Router, TypeScript)
- PostgreSQL via Supabase, schema managed by Prisma + raw SQL migrations
- Supabase Auth (roles: `passenger`, `operator_admin`, `conductor`, `super_admin`)
- Supabase Realtime for live seat-map updates
- TanStack Query (server state) + Zustand (client checkout state)

## Where things live

| Concern | Path |
|---|---|
| Source-of-truth SQL migration | `supabase/migrations/0001_init_busx_core.sql` |
| Prisma schema (mirrors the SQL) | `prisma/schema.prisma` |
| Domain TypeScript types | `src/types/database.ts` |
| Supabase clients (browser / server / service-role / middleware) | `src/lib/supabase/` |
| HMAC ticket signing (offline-verifiable QR) | `src/lib/crypto/ticket-hmac.ts` |
| Business logic services | `src/lib/services/` |
| API route handlers | `src/app/api/` |
| Zustand checkout store | `src/store/booking-store.ts` |
| TanStack Query hooks | `src/hooks/` |

## The three hard problems this schema solves

1. **Multi-stop segment graph.** `route_stops.order_index` is the canonical
   sequence for an N-stop route. Every segment (pricing, availability,
   tickets, locks) is expressed as `[origin_order_index, destination_order_index)`
   over that sequence — never as a flat origin/destination pair on the route
   itself.

2. **Dynamic segment capacity.** A seat is not "booked" or "free" per trip —
   it's free for any segment range that doesn't overlap an existing hold or
   ticket. This is enforced with a Postgres `EXCLUDE USING gist` constraint
   on `seat_locks` and `tickets` over a generated `int4range` column, keyed
   on `(trip_id, seat_id)`. Seat 12 sold for stops 1→3 remains bookable for
   3→6 on the same trip because `[1,3)` and `[3,6)` don't overlap — and this
   is guaranteed by the database itself under concurrent writes, not by
   application-level locking.

3. **Differential matrix pricing.** `segment_pricing_matrix` prices every
   `(route, origin_route_stop, destination_route_stop, fare_class)` tuple
   independently, with a validity window for seasonal fares. A
   trigger (`enforce_pricing_stop_order`) rejects any row where destination
   doesn't come after origin along the route.

## Local setup

```bash
cp .env.example .env.local   # fill in Supabase + HMAC secrets
npm install
npx prisma generate
# Apply supabase/migrations/0001_init_busx_core.sql to your Supabase project
# (via `supabase db push` or the SQL editor) before running `prisma migrate`,
# since it contains GiST/RLS/trigger SQL Prisma's migrate cannot generate.
npm run dev
```
