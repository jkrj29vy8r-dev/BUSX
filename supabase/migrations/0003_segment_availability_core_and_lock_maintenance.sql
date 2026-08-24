-- ============================================================================
-- Migration 0003 — segment availability core function + seat-lock maintenance
--
-- 1. get_available_seats_for_segment(trip, start_stop_order, end_stop_order)
--    is now the CANONICAL implementation of "is this seat free across every
--    intermediate segment it would overlap" — keyed directly by order_index
--    integers, no route_stop UUID resolution required of the caller.
--
--    get_segment_seat_availability(trip, origin_uuid, dest_uuid) (0001, used
--    by the passenger seat map) is refactored to resolve order indices and
--    delegate here instead of re-running its own copy of the overlap query.
--    One definition of "occupied" for the whole system — the app layer, this
--    new order-index entry point, and any direct SQL/PostgREST RPC caller
--    can never disagree.
--
--    This refactor also closes a latent gap in the original function: it
--    resolved p_origin_route_stop_id / p_destination_route_stop_id via bare
--    subqueries with no existence check, so an unknown route_stop id quietly
--    produced a NULL range and an EMPTY blocked-seats set — i.e. "everything
--    is available" — instead of an error. It was never reachable through the
--    app (the TS caller already validates both ids exist first), but a
--    direct RPC/PostgREST caller bypassing that layer would have hit it.
--    Both functions now raise a clear exception instead.
--
-- 2. release_expired_seat_locks() (0001) is unchanged. This migration adds a
--    guarded pg_cron schedule for it, wrapped in a DO block that checks for
--    the extension first — a no-op on a bare Postgres instance (this repo's
--    local dev DB has no pg_cron, so this block does nothing here), but a
--    real scheduled sweep on a Supabase project with pg_cron enabled. Where
--    pg_cron isn't available (or not yet enabled on the project), the
--    POST /api/internal/seat-locks/sweep route added alongside this
--    migration is the equivalent hook for an external scheduler (Vercel
--    Cron, etc). Either way, correctness never depends on the sweep running
--    promptly: get_available_seats_for_segment already filters seat_locks by
--    `expires_at > now()` directly, so a seat frees up in every availability
--    read the instant its hold lapses, regardless of when status actually
--    flips to 'expired'. The sweep only exists so the GiST EXCLUDE
--    constraint (keyed on status = 'active', not on expires_at) doesn't keep
--    a stale row around indefinitely blocking new locks/tickets when nobody
--    else has attempted one since — createSeatLock() already calls
--    release_expired_seat_locks() opportunistically right before every
--    insert, which independently covers that case on the write path too.
-- ============================================================================

create or replace function get_available_seats_for_segment(
  p_trip_id uuid,
  p_start_stop_order int,
  p_end_stop_order int
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
language plpgsql
stable
as $$
declare
  v_vehicle_id uuid;
  v_route_id uuid;
  v_matching_stops int;
begin
  if p_start_stop_order is null or p_end_stop_order is null then
    raise exception 'start_stop_order/end_stop_order must not be null' using errcode = '22004';
  end if;
  if p_end_stop_order <= p_start_stop_order then
    raise exception 'end_stop_order (%) must be greater than start_stop_order (%)', p_end_stop_order, p_start_stop_order
      using errcode = '22023'; -- invalid_parameter_value
  end if;

  select t.vehicle_id, t.route_id into v_vehicle_id, v_route_id
  from trips t
  where t.id = p_trip_id;

  if v_vehicle_id is null then
    raise exception 'trip % not found', p_trip_id using errcode = 'P0002'; -- no_data_found
  end if;

  select count(*) into v_matching_stops
  from route_stops rs
  where rs.route_id = v_route_id
    and rs.order_index in (p_start_stop_order, p_end_stop_order);

  if v_matching_stops <> 2 then
    raise exception 'route % has no stop at order_index % and/or %', v_route_id, p_start_stop_order, p_end_stop_order
      using errcode = 'P0002';
  end if;

  return query
    with requested_range as (
      select int4range(p_start_stop_order, p_end_stop_order, '[)') as rng
    ),
    blocked_seats as (
      select tk.seat_id
      from tickets tk, requested_range r
      where tk.trip_id = p_trip_id
        and tk.status in ('reserved', 'paid', 'checked_in', 'boarded')
        and tk.segment_range && r.rng
      union
      select l.seat_id
      from seat_locks l, requested_range r
      where l.trip_id = p_trip_id
        and l.status = 'active'
        and l.expires_at > now()
        and l.segment_range && r.rng
    )
    select
      s.id,
      s.seat_number,
      s.row_number,
      s.col_position,
      s.deck,
      s.seat_type,
      (s.is_bookable and s.id not in (select blocked_seats.seat_id from blocked_seats)) as is_available
    from seats s
    where s.vehicle_id = v_vehicle_id
    order by s.deck, s.row_number, s.col_position;
end;
$$;

comment on function get_available_seats_for_segment(uuid, int, int) is
  'Single source of truth for segment seat availability, keyed by order_index. "Occupied" = an active-status ticket OR an active, unexpired seat_lock whose [start,end) range overlaps the requested one. get_segment_seat_availability() delegates here.';

-- Same public signature as 0001 — body now delegates to the core function
-- above instead of re-implementing the overlap query.
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
language plpgsql
stable
as $$
declare
  v_origin_idx int;
  v_dest_idx int;
begin
  select order_index into v_origin_idx from route_stops where id = p_origin_route_stop_id;
  if v_origin_idx is null then
    raise exception 'origin route_stop % not found', p_origin_route_stop_id using errcode = 'P0002';
  end if;

  select order_index into v_dest_idx from route_stops where id = p_destination_route_stop_id;
  if v_dest_idx is null then
    raise exception 'destination route_stop % not found', p_destination_route_stop_id using errcode = 'P0002';
  end if;

  return query
    select * from get_available_seats_for_segment(p_trip_id, v_origin_idx, v_dest_idx);
end;
$$;

-- Guarded pg_cron schedule — see header comment. No-op unless pg_cron is
-- installed (it is not, on this repo's local dev Postgres).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute $sql$
      select cron.schedule('release-expired-seat-locks', '*/2 * * * *', 'select release_expired_seat_locks()')
    $sql$;
  end if;
end;
$$;
