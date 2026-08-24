-- ============================================================================
-- BUSX CORE SCHEMA — Migration 0001
-- Multi-stop segment-graph passenger transport platform
--
-- Design pillars:
--   1. Routes are N-stop graphs (route_stops.order_index is the canonical
--      sequence). A trip's occupancy for any seat is computed as an interval
--      over order_index, not a boolean per-trip flag — this is what lets
--      Segment(1->3) and Segment(3->6) on the same seat coexist safely.
--   2. Segment overlap is enforced at the DATABASE level via a GiST EXCLUDE
--      constraint over int4range(origin_order_index, destination_order_index),
--      so double-booking a seat for an overlapping segment is impossible even
--      under concurrent writes — no amount of app-level bug can defeat it.
--   3. Pricing is a matrix keyed by (origin route_stop, destination route_stop),
--      not a flat per-trip fare.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid, hmac()
create extension if not exists "btree_gist";     -- required for EXCLUDE USING gist on scalar + range

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------
create type user_role as enum ('passenger', 'operator_admin', 'conductor', 'super_admin');
create type company_status as enum ('pending', 'active', 'suspended', 'terminated');
create type vehicle_type as enum ('minibus_16', 'sprinter_19', 'isuzu_30', 'coach_50', 'double_decker_70', 'custom');
create type seat_type as enum ('standard', 'premium', 'disabled_access', 'driver', 'conductor');
create type trip_status as enum ('scheduled', 'boarding', 'departed', 'in_transit', 'completed', 'cancelled', 'delayed');
create type stop_event_status as enum ('pending', 'arrived', 'departed', 'skipped');
create type lock_status as enum ('active', 'released', 'converted', 'expired');
create type ticket_status as enum ('reserved', 'paid', 'checked_in', 'boarded', 'cancelled', 'refunded', 'expired', 'no_show');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
create type fare_class as enum ('standard', 'premium', 'student', 'senior');

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- COMPANIES  (carrier / operator tenant)
-- ============================================================================
create table companies (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  legal_name         text,
  fiscal_code        text,
  brand_primary_color   text not null default '#0F172A'
    constraint chk_companies_primary_hex check (brand_primary_color ~* '^#[0-9A-F]{6}$'),
  brand_secondary_color text not null default '#38BDF8'
    constraint chk_companies_secondary_hex check (brand_secondary_color ~* '^#[0-9A-F]{6}$'),
  logo_url           text,
  support_phone      text,
  support_email      text,
  commission_rate_pct numeric(5,2) not null default 10.00
    constraint chk_companies_commission check (commission_rate_pct >= 0 and commission_rate_pct <= 100),
  status             company_status not null default 'pending',
  is_verified        boolean not null default false,
  verified_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint chk_companies_slug_format check (slug ~* '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create trigger trg_companies_updated_at before update on companies
  for each row execute function set_updated_at();

-- ============================================================================
-- PROFILES  (extends auth.users — multi-tenant identity: passenger / operator_admin / conductor / super_admin)
-- ============================================================================
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'passenger',
  company_id    uuid references companies(id) on delete set null,
  full_name     text,
  phone         text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_profiles_company_scope check (
    (role in ('operator_admin', 'conductor') and company_id is not null)
    or (role in ('passenger', 'super_admin'))
  )
);
create index idx_profiles_company_id on profiles(company_id);
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ============================================================================
-- STOPS  (shared master list of physical stations / stops)
-- ============================================================================
create table stops (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  city          text not null,
  county        text,
  country_code  char(2) not null default 'RO',
  station_code  text unique,
  latitude      numeric(9,6) not null,
  longitude     numeric(9,6) not null,
  timezone      text not null default 'Europe/Bucharest',
  is_airport    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_stops_lat check (latitude between -90 and 90),
  constraint chk_stops_lng check (longitude between -180 and 180)
);
create index idx_stops_city on stops(city);
create trigger trg_stops_updated_at before update on stops
  for each row execute function set_updated_at();

-- ============================================================================
-- ROUTES  (owned by a company; the template graph)
-- ============================================================================
create table routes (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id) on delete cascade,
  name           text not null,
  slug           text not null,
  distance_km    numeric(7,2),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (company_id, slug)
);
create index idx_routes_company_id on routes(company_id);
create trigger trg_routes_updated_at before update on routes
  for each row execute function set_updated_at();

-- ============================================================================
-- ROUTE_STOPS  (the N-stop graph — order_index is the canonical sequence)
-- e.g. Targu Neamt(0) -> Piatra Neamt(1) -> Roman(2) -> Bacau(3) -> Otopeni(4) -> Bucuresti(5)
-- ============================================================================
create table route_stops (
  id                          uuid primary key default gen_random_uuid(),
  route_id                    uuid not null references routes(id) on delete cascade,
  stop_id                     uuid not null references stops(id) on delete restrict,
  order_index                 int not null,
  arrival_offset_minutes      int not null default 0,
  departure_offset_minutes    int not null default 0,
  distance_from_start_km      numeric(7,2),
  platform_or_gate            text,
  is_pickup_point             boolean not null default true,
  is_dropoff_point            boolean not null default true,
  created_at                  timestamptz not null default now(),
  constraint chk_route_stops_order_index check (order_index >= 0),
  constraint chk_route_stops_offsets check (departure_offset_minutes >= arrival_offset_minutes),
  unique (route_id, order_index),
  unique (route_id, stop_id)
);
create index idx_route_stops_route_id on route_stops(route_id, order_index);
create index idx_route_stops_stop_id on route_stops(stop_id);

-- A route needs >= 2 stops to be bookable; enforced at application layer on publish,
-- not here, since it can't hold true row-by-row during graph construction.

-- ============================================================================
-- SEGMENT_PRICING_MATRIX  (differential price between any origin/destination pair on a route)
-- ============================================================================
create table segment_pricing_matrix (
  id                    uuid primary key default gen_random_uuid(),
  route_id              uuid not null references routes(id) on delete cascade,
  origin_route_stop_id      uuid not null references route_stops(id) on delete cascade,
  destination_route_stop_id uuid not null references route_stops(id) on delete cascade,
  fare_class            fare_class not null default 'standard',
  price_amount          numeric(10,2) not null,
  currency              char(3) not null default 'RON',
  valid_from            date not null default current_date,
  valid_until           date,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint chk_pricing_amount_positive check (price_amount >= 0),
  constraint chk_pricing_validity check (valid_until is null or valid_until >= valid_from),
  constraint chk_pricing_distinct_stops check (origin_route_stop_id <> destination_route_stop_id),
  unique (route_id, origin_route_stop_id, destination_route_stop_id, fare_class, valid_from)
);
create index idx_pricing_route_od on segment_pricing_matrix(route_id, origin_route_stop_id, destination_route_stop_id);
create trigger trg_pricing_updated_at before update on segment_pricing_matrix
  for each row execute function set_updated_at();

-- Enforce that origin precedes destination along the route's order_index sequence,
-- and that both route_stops belong to the same route_id declared on the matrix row.
create or replace function enforce_pricing_stop_order()
returns trigger
language plpgsql
as $$
declare
  origin_idx int;
  dest_idx int;
  origin_route uuid;
  dest_route uuid;
begin
  select order_index, route_id into origin_idx, origin_route from route_stops where id = new.origin_route_stop_id;
  select order_index, route_id into dest_idx, dest_route from route_stops where id = new.destination_route_stop_id;

  if origin_route is null or dest_route is null then
    raise exception 'origin/destination route_stop_id must exist';
  end if;
  if origin_route <> new.route_id or dest_route <> new.route_id then
    raise exception 'origin/destination route_stop_id must belong to route_id %', new.route_id;
  end if;
  if dest_idx <= origin_idx then
    raise exception 'destination_route_stop_id (order_index=%) must come after origin_route_stop_id (order_index=%)', dest_idx, origin_idx;
  end if;

  return new;
end;
$$;
create trigger trg_pricing_stop_order
  before insert or update on segment_pricing_matrix
  for each row execute function enforce_pricing_stop_order();

-- ============================================================================
-- VEHICLES  (supports custom seat layouts: 19-seat Sprinter, 30-seat Isuzu, 50-seat Coach, ...)
-- ============================================================================
create table vehicles (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references companies(id) on delete cascade,
  registration_plate text not null unique,
  vehicle_type       vehicle_type not null,
  total_seats        int not null,
  -- seat_layout describes the visual grid the passenger-facing seat map renders from:
  -- { "rows": 13, "cols": 4, "aisleAfterCol": 2, "deck": 1,
  --   "disabledCells": [[0,0]], "layoutVersion": 1 }
  seat_layout        jsonb not null default '{}'::jsonb,
  amenities          jsonb not null default '[]'::jsonb,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint chk_vehicles_total_seats check (total_seats > 0)
);
create index idx_vehicles_company_id on vehicles(company_id);
create trigger trg_vehicles_updated_at before update on vehicles
  for each row execute function set_updated_at();

-- ============================================================================
-- SEATS  (physical seat inventory per vehicle — FK target for locks & tickets)
-- ============================================================================
create table seats (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid not null references vehicles(id) on delete cascade,
  seat_number   text not null,
  row_number    int not null,
  col_position  int not null,
  deck          int not null default 1,
  seat_type     seat_type not null default 'standard',
  is_bookable   boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (vehicle_id, seat_number)
);
create index idx_seats_vehicle_id on seats(vehicle_id);

-- ============================================================================
-- TRIPS  (a scheduled instance of a route, running on a specific vehicle)
-- ============================================================================
create table trips (
  id             uuid primary key default gen_random_uuid(),
  route_id       uuid not null references routes(id) on delete restrict,
  vehicle_id     uuid not null references vehicles(id) on delete restrict,
  company_id     uuid not null references companies(id) on delete cascade,
  driver_id      uuid references profiles(id) on delete set null,
  conductor_id   uuid references profiles(id) on delete set null,
  departure_at   timestamptz not null,
  status         trip_status not null default 'scheduled',
  currency       char(3) not null default 'RON',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (route_id, vehicle_id, departure_at)
);
create index idx_trips_route_departure on trips(route_id, departure_at);
create index idx_trips_company_departure on trips(company_id, departure_at);
create index idx_trips_status on trips(status) where status in ('scheduled', 'boarding', 'delayed');
create trigger trg_trips_updated_at before update on trips
  for each row execute function set_updated_at();

-- ============================================================================
-- TRIP_STOP_TIMES  (live, per-trip realization of route_stops — actuals for GPS/ETA tracking)
-- ============================================================================
create table trip_stop_times (
  id                   uuid primary key default gen_random_uuid(),
  trip_id              uuid not null references trips(id) on delete cascade,
  route_stop_id        uuid not null references route_stops(id) on delete restrict,
  scheduled_arrival    timestamptz not null,
  scheduled_departure  timestamptz not null,
  actual_arrival       timestamptz,
  actual_departure     timestamptz,
  status               stop_event_status not null default 'pending',
  unique (trip_id, route_stop_id)
);
create index idx_trip_stop_times_trip_id on trip_stop_times(trip_id);

-- ============================================================================
-- BOOKINGS  (checkout/order grouping — one payment, N tickets)
-- ============================================================================
create table bookings (
  id                uuid primary key default gen_random_uuid(),
  booking_number    text not null unique,
  user_id           uuid references profiles(id) on delete set null,
  contact_email     text not null,
  contact_phone     text,
  total_amount      numeric(10,2) not null default 0,
  currency          char(3) not null default 'RON',
  payment_status    payment_status not null default 'pending',
  payment_provider  text,
  payment_reference text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint chk_bookings_amount check (total_amount >= 0)
);
create index idx_bookings_user_id on bookings(user_id);
create trigger trg_bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

-- ============================================================================
-- SEAT_LOCKS  (temporary 10-min holds; Supabase Realtime broadcasts changes to
-- this table so every client's seat map updates live as seats go from
-- available -> locked -> sold)
-- ============================================================================
create table seat_locks (
  id                       uuid primary key default gen_random_uuid(),
  trip_id                  uuid not null references trips(id) on delete cascade,
  seat_id                  uuid not null references seats(id) on delete cascade,
  origin_route_stop_id     uuid not null references route_stops(id),
  destination_route_stop_id uuid not null references route_stops(id),
  origin_order_index       int not null,
  destination_order_index  int not null,
  -- computed once at insert time so the GiST exclusion below can index it directly
  segment_range            int4range generated always as
                              (int4range(origin_order_index, destination_order_index, '[)')) stored,
  locked_by_user_id        uuid references profiles(id) on delete set null,
  session_id               text not null,        -- correlates to guest/browser checkout session
  status                   lock_status not null default 'active',
  expires_at               timestamptz not null default (now() + interval '10 minutes'),
  created_at               timestamptz not null default now(),
  constraint chk_seat_locks_order check (destination_order_index > origin_order_index),

  -- THE CORE CONCURRENCY GUARANTEE:
  -- No two ACTIVE, non-expired locks for the same (trip, seat) may hold
  -- overlapping segment ranges. Seat 12 locked for [1,3) blocks a new lock on
  -- [2,4) but NOT on [3,6) — they are adjacent, not overlapping.
  exclude using gist (
    trip_id with =,
    seat_id with =,
    segment_range with &&
  ) where (status = 'active')
);
create index idx_seat_locks_trip_seat on seat_locks(trip_id, seat_id);
create index idx_seat_locks_expires_at on seat_locks(expires_at) where status = 'active';
create index idx_seat_locks_session on seat_locks(session_id);

-- ============================================================================
-- TICKETS  (confirmed, paid bookings — cryptographically signed for offline QR scan)
-- ============================================================================
create table tickets (
  id                        uuid primary key default gen_random_uuid(),
  ticket_number             text not null unique,
  booking_id                uuid not null references bookings(id) on delete cascade,
  trip_id                   uuid not null references trips(id) on delete restrict,
  seat_id                   uuid not null references seats(id) on delete restrict,
  origin_route_stop_id      uuid not null references route_stops(id),
  destination_route_stop_id uuid not null references route_stops(id),
  origin_order_index        int not null,
  destination_order_index   int not null,
  segment_range             int4range generated always as
                               (int4range(origin_order_index, destination_order_index, '[)')) stored,
  passenger_id              uuid references profiles(id) on delete set null,
  passenger_full_name       text not null,
  passenger_phone           text,
  passenger_email           text,
  fare_class                fare_class not null default 'standard',
  price_amount              numeric(10,2) not null,
  currency                  char(3) not null default 'RON',
  status                    ticket_status not null default 'reserved',
  -- Offline-verifiable crypto envelope: qr_payload is the canonical JSON the
  -- HMAC signs; hmac_signature = HMAC-SHA256(qr_payload, server_secret[key_version]).
  -- A conductor's device with no network can recompute the HMAC locally
  -- (secret provisioned at app install / rotated per company) and validate
  -- ticket_number + trip_id + seat_id + segment + exp without a DB round-trip.
  qr_payload                text not null,
  hmac_signature            text not null,
  signature_key_version     smallint not null default 1,
  issued_at                 timestamptz not null default now(),
  checked_in_at             timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint chk_tickets_order check (destination_order_index > origin_order_index),
  constraint chk_tickets_amount check (price_amount >= 0),

  -- Mirrors the seat_locks guarantee, but for CONFIRMED inventory: an active
  -- (unpaid-hold-converted-or-paid) ticket permanently reserves its segment
  -- range for that seat on that trip.
  exclude using gist (
    trip_id with =,
    seat_id with =,
    segment_range with &&
  ) where (status in ('reserved', 'paid', 'checked_in', 'boarded'))
);
create index idx_tickets_trip_seat on tickets(trip_id, seat_id);
create index idx_tickets_booking_id on tickets(booking_id);
create index idx_tickets_passenger_id on tickets(passenger_id);
create trigger trg_tickets_updated_at before update on tickets
  for each row execute function set_updated_at();

-- ============================================================================
-- FUNCTIONS: segment-graph availability & pricing (used by the API layer,
-- and safe to call directly from Postgres/PostgREST for defense in depth)
-- ============================================================================

-- Returns every seat on a trip's vehicle with its availability for the
-- requested [origin_order_index, destination_order_index) segment, taking
-- into account both confirmed tickets and active, non-expired locks.
create or replace function get_segment_seat_availability(
  p_trip_id uuid,
  p_origin_route_stop_id uuid,
  p_destination_route_stop_id uuid
)
returns table (
  seat_id uuid,
  seat_number text,
  row_number int,
  col_position int,
  deck int,
  seat_type seat_type,
  is_available boolean
)
language sql
stable
as $$
  with trip_vehicle as (
    select v.id as vehicle_id from trips t join vehicles v on v.id = t.vehicle_id where t.id = p_trip_id
  ),
  requested as (
    select
      (select order_index from route_stops where id = p_origin_route_stop_id) as origin_idx,
      (select order_index from route_stops where id = p_destination_route_stop_id) as dest_idx
  ),
  requested_range as (
    select int4range(origin_idx, dest_idx, '[)') as rng from requested
  ),
  blocked_seats as (
    select t.seat_id
    from tickets t, requested_range r
    where t.trip_id = p_trip_id
      and t.status in ('reserved', 'paid', 'checked_in', 'boarded')
      and t.segment_range && r.rng
    union
    select l.seat_id
    from seat_locks l, requested_range r
    where l.trip_id = p_trip_id
      and l.status = 'active'
      and l.expires_at > now()
      and l.segment_range && r.rng
  )
  select
    s.id, s.seat_number, s.row_number, s.col_position, s.deck, s.seat_type,
    (s.is_bookable and s.id not in (select seat_id from blocked_seats)) as is_available
  from seats s, trip_vehicle tv
  where s.vehicle_id = tv.vehicle_id
  order by s.deck, s.row_number, s.col_position;
$$;

-- Resolves the matrix price for a route + origin/destination + fare class,
-- honoring validity windows. Returns null if no active price exists (caller
-- should treat this as "segment not sellable").
create or replace function get_segment_price(
  p_route_id uuid,
  p_origin_route_stop_id uuid,
  p_destination_route_stop_id uuid,
  p_fare_class fare_class default 'standard',
  p_on_date date default current_date
)
returns table (price_amount numeric(10,2), currency char(3))
language sql
stable
as $$
  select price_amount, currency
  from segment_pricing_matrix
  where route_id = p_route_id
    and origin_route_stop_id = p_origin_route_stop_id
    and destination_route_stop_id = p_destination_route_stop_id
    and fare_class = p_fare_class
    and is_active
    and valid_from <= p_on_date
    and (valid_until is null or valid_until >= p_on_date)
  order by valid_from desc
  limit 1;
$$;

-- Housekeeping: flips expired active locks to 'expired' so they stop
-- occupying the GiST exclusion window. Intended to run on a scheduled
-- Supabase Edge Function / pg_cron every 1-2 minutes; also called
-- opportunistically from the seat-lock API before creating a new lock.
create or replace function release_expired_seat_locks()
returns int
language plpgsql
as $$
declare
  released_count int;
begin
  update seat_locks
  set status = 'expired'
  where status = 'active' and expires_at <= now();
  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Helper functions (SECURITY DEFINER to avoid RLS recursion on profiles)
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function auth_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from profiles where id = auth.uid();
$$;

alter table companies enable row level security;
alter table profiles enable row level security;
alter table stops enable row level security;
alter table routes enable row level security;
alter table route_stops enable row level security;
alter table segment_pricing_matrix enable row level security;
alter table vehicles enable row level security;
alter table seats enable row level security;
alter table trips enable row level security;
alter table trip_stop_times enable row level security;
alter table bookings enable row level security;
alter table seat_locks enable row level security;
alter table tickets enable row level security;

-- companies: public can read active/verified carriers; operator_admin manages own company
create policy companies_public_read on companies for select
  using (status = 'active');
create policy companies_operator_manage on companies for all
  using (auth_role() = 'operator_admin' and id = auth_company_id())
  with check (auth_role() = 'operator_admin' and id = auth_company_id());
create policy companies_super_admin_all on companies for all
  using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

-- profiles: users manage their own row; operator_admin can view staff in their company
create policy profiles_self on profiles for select using (id = auth.uid());
create policy profiles_self_update on profiles for update using (id = auth.uid());
create policy profiles_company_staff_read on profiles for select
  using (auth_role() in ('operator_admin', 'super_admin') and company_id = auth_company_id());

-- stops, routes, route_stops, segment_pricing_matrix: public read (needed for search/booking UI)
create policy stops_public_read on stops for select using (true);
create policy routes_public_read on routes for select using (is_active);
create policy routes_operator_manage on routes for all
  using (auth_role() = 'operator_admin' and company_id = auth_company_id())
  with check (auth_role() = 'operator_admin' and company_id = auth_company_id());

create policy route_stops_public_read on route_stops for select using (true);
create policy route_stops_operator_manage on route_stops for all
  using (auth_role() = 'operator_admin' and route_id in (select id from routes where company_id = auth_company_id()))
  with check (auth_role() = 'operator_admin' and route_id in (select id from routes where company_id = auth_company_id()));

create policy pricing_public_read on segment_pricing_matrix for select using (is_active);
create policy pricing_operator_manage on segment_pricing_matrix for all
  using (auth_role() = 'operator_admin' and route_id in (select id from routes where company_id = auth_company_id()))
  with check (auth_role() = 'operator_admin' and route_id in (select id from routes where company_id = auth_company_id()));

-- vehicles, seats: operator manages own fleet; public can read for seat map rendering
create policy vehicles_public_read on vehicles for select using (is_active);
create policy vehicles_operator_manage on vehicles for all
  using (auth_role() = 'operator_admin' and company_id = auth_company_id())
  with check (auth_role() = 'operator_admin' and company_id = auth_company_id());

create policy seats_public_read on seats for select using (true);
create policy seats_operator_manage on seats for all
  using (auth_role() = 'operator_admin' and vehicle_id in (select id from vehicles where company_id = auth_company_id()))
  with check (auth_role() = 'operator_admin' and vehicle_id in (select id from vehicles where company_id = auth_company_id()));

-- trips: public read for search; operator_admin/conductor manage own company's trips
create policy trips_public_read on trips for select using (true);
create policy trips_operator_manage on trips for all
  using (auth_role() = 'operator_admin' and company_id = auth_company_id())
  with check (auth_role() = 'operator_admin' and company_id = auth_company_id());
create policy trips_conductor_read on trips for select
  using (auth_role() = 'conductor' and company_id = auth_company_id());
create policy trips_conductor_update on trips for update
  using (auth_role() = 'conductor' and company_id = auth_company_id());

create policy trip_stop_times_public_read on trip_stop_times for select using (true);
create policy trip_stop_times_staff_manage on trip_stop_times for all
  using (auth_role() in ('operator_admin', 'conductor')
         and trip_id in (select id from trips where company_id = auth_company_id()))
  with check (auth_role() in ('operator_admin', 'conductor')
              and trip_id in (select id from trips where company_id = auth_company_id()));

-- bookings: owner (or guest via service role from the API) can read/write their own
create policy bookings_owner on bookings for select using (user_id = auth.uid());
create policy bookings_owner_write on bookings for insert with check (user_id = auth.uid() or user_id is null);
create policy bookings_owner_update on bookings for update using (user_id = auth.uid());

-- seat_locks: the locking user can see/manage their own lock; company staff can view for their trips
create policy seat_locks_owner on seat_locks for all
  using (locked_by_user_id = auth.uid())
  with check (locked_by_user_id = auth.uid());
create policy seat_locks_staff_read on seat_locks for select
  using (auth_role() in ('operator_admin', 'conductor')
         and trip_id in (select id from trips where company_id = auth_company_id()));

-- tickets: passenger reads own tickets; company staff (operator_admin/conductor) read/check-in
-- tickets for their own trips
create policy tickets_passenger_read on tickets for select using (passenger_id = auth.uid());
create policy tickets_staff_read on tickets for select
  using (auth_role() in ('operator_admin', 'conductor')
         and trip_id in (select id from trips where company_id = auth_company_id()));
create policy tickets_conductor_checkin on tickets for update
  using (auth_role() = 'conductor' and trip_id in (select id from trips where company_id = auth_company_id()));

-- Note: ticket issuance (insert), payment confirmation, and lock creation are
-- performed by the API layer using the Supabase service role (bypassing RLS)
-- inside a single transaction, since they involve cross-tenant validation
-- (pricing lookup, GiST exclusion enforcement, HMAC signing) that must not be
-- delegated to client-held credentials.
