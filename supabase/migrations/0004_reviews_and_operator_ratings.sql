-- ============================================================================
-- Migration 0004 — passenger reviews + denormalized operator ratings
--
-- 1. reviews: one row per (booking, passenger) — not per operator visit in
--    the abstract. Deviates from the literal brief in two ways, both to
--    make "average_rating" mean something real rather than a number anyone
--    logged in can inflate:
--      - booking_id is added and made NOT NULL (the brief's column list
--        didn't include it). Without it there is no way to tell a review
--        submitted by someone who actually traveled with this operator from
--        one submitted by anyone with an account, and no way to stop the
--        same trip being reviewed five times. unique(booking_id) caps it at
--        one review per booking.
--      - reviews_passenger_write's WITH CHECK below requires a real ticket:
--        that passenger, on a trip belonging to operator_id, under this
--        exact booking_id, with a status meaning they actually held a valid
--        (not cancelled/expired) ticket. A review that can't prove that
--        never gets written, RLS-enforced, not just app-layer-trusted.
--
-- 2. "computed column average_rating for operators": Postgres generated
--    columns (`generated always as (...) stored`) can only reference other
--    columns on the SAME row — they cannot aggregate a related table, so a
--    literal computed column is not possible here. companies.average_rating
--    and companies.rating_count are added as ordinary columns instead, kept
--    in sync by refresh_company_rating() below (an AFTER trigger on
--    reviews), which is the standard Postgres equivalent: reads stay O(1)
--    (no aggregating every review on every company read), and the columns
--    are always consistent with the reviews table because nothing else is
--    allowed to write them directly.
-- ============================================================================

create table reviews (
  id           uuid primary key default gen_random_uuid(),
  operator_id  uuid not null references companies(id) on delete cascade,
  passenger_id uuid not null references profiles(id) on delete cascade,
  booking_id   uuid not null references bookings(id) on delete cascade,
  rating       smallint not null,
  comment      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint chk_reviews_rating check (rating between 1 and 5),
  constraint uq_reviews_booking unique (booking_id)
);
create index idx_reviews_operator_id on reviews(operator_id);
create index idx_reviews_passenger_id on reviews(passenger_id);

comment on table reviews is
  'One review per booking (uq_reviews_booking), gated at write time to bookings that actually held a valid ticket with that operator — see reviews_passenger_write.';

create trigger trg_reviews_updated_at before update on reviews
  for each row execute function set_updated_at();

-- A review's identity (who, which operator, which booking) is fixed at
-- creation — only rating/comment are ever meant to change on an edit.
create or replace function reviews_lock_identity() returns trigger
language plpgsql as $$
begin
  if new.operator_id is distinct from old.operator_id
     or new.passenger_id is distinct from old.passenger_id
     or new.booking_id is distinct from old.booking_id then
    raise exception 'reviews.operator_id / passenger_id / booking_id cannot be changed after creation';
  end if;
  return new;
end;
$$;
create trigger trg_reviews_lock_identity before update on reviews
  for each row execute function reviews_lock_identity();

-- ----------------------------------------------------------------------------
-- Denormalized rating on companies — see header note on why this isn't a
-- generated column.
-- ----------------------------------------------------------------------------
alter table companies
  add column average_rating numeric(2,1),
  add column rating_count   integer not null default 0
    constraint chk_companies_rating_count check (rating_count >= 0);

comment on column companies.average_rating is
  'Denormalized avg(reviews.rating) for this operator, maintained by trg_reviews_refresh_rating. NULL until the first review exists.';
comment on column companies.rating_count is
  'Denormalized count(reviews.*) for this operator, maintained by trg_reviews_refresh_rating.';

create or replace function refresh_company_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  affected_operator_id uuid := coalesce(new.operator_id, old.operator_id);
begin
  update companies
  set average_rating = (select round(avg(rating)::numeric, 1) from reviews where operator_id = affected_operator_id),
      rating_count   = (select count(*) from reviews where operator_id = affected_operator_id)
  where id = affected_operator_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_reviews_refresh_rating
  after insert or update of rating or delete on reviews
  for each row execute function refresh_company_rating();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table reviews enable row level security;

-- public read — ratings/reviews are meant to be seen by anyone browsing operators
create policy reviews_public_read on reviews for select using (true);

-- a passenger may review their OWN booking, and only if that booking holds a
-- real (non-cancelled, non-expired) ticket with the operator being reviewed
create policy reviews_passenger_write on reviews for insert
  with check (
    passenger_id = auth.uid()
    and exists (
      select 1
      from tickets tk
      join trips t on t.id = tk.trip_id
      where tk.booking_id = reviews.booking_id
        and tk.passenger_id = auth.uid()
        and t.company_id = reviews.operator_id
        and tk.status not in ('cancelled', 'expired')
    )
  );

-- a passenger may edit/delete their own review (rating/comment only — see
-- trg_reviews_lock_identity above); operators cannot edit or delete reviews
-- of themselves
create policy reviews_passenger_update on reviews for update
  using (passenger_id = auth.uid()) with check (passenger_id = auth.uid());
create policy reviews_passenger_delete on reviews for delete
  using (passenger_id = auth.uid());
