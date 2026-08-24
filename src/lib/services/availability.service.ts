import "server-only";

import { prisma } from "@/lib/prisma";
import { getSegmentPrice, SegmentNotSellableError, InvalidSegmentOrderError } from "@/lib/services/pricing.service";
import type {
  PriceQuote,
  ResolvedSegment,
  RouteStopId,
  SeatAvailability,
  SeatId,
  SegmentSeatMap,
  TripId,
} from "@/types/database";

export class TripNotFoundError extends Error {
  constructor(tripId: string) {
    super(`Trip ${tripId} not found`);
    this.name = "TripNotFoundError";
  }
}

/** Thrown when a requested order_index has no corresponding route_stop on
 * the trip's route — e.g. a stale client asking about a stop that was
 * removed from the route, or a hand-crafted request with a made-up index. */
export class StopOrderNotFoundError extends Error {
  constructor(routeId: string, orders: number[]) {
    super(`Route ${routeId} has no stop at order_index ${orders.join(" and/or ")}`);
    this.name = "StopOrderNotFoundError";
  }
}

async function tryGetPrice(params: Parameters<typeof getSegmentPrice>[0]): Promise<PriceQuote | null> {
  try {
    return await getSegmentPrice(params);
  } catch (err) {
    if (err instanceof SegmentNotSellableError) return null;
    throw err;
  }
}

type SegmentAvailabilityRow = {
  seat_id: string;
  seat_number: string;
  row_number: number;
  col_position: number;
  deck: number;
  seat_type: string;
  is_available: boolean;
};

function toSeatAvailability(r: SegmentAvailabilityRow): SeatAvailability {
  return {
    seatId: r.seat_id as SeatAvailability["seatId"],
    seatNumber: r.seat_number,
    rowNumber: r.row_number,
    colPosition: r.col_position,
    deck: r.deck,
    seatType: r.seat_type as SeatAvailability["seatType"],
    isAvailable: r.is_available,
  };
}

/**
 * Delegates to the `get_segment_seat_availability` SQL function (see
 * 0001_init_busx_core.sql) rather than reimplementing the overlap query in
 * Prisma. Two reasons:
 *   1. `segment_range` is a GENERATED ALWAYS AS STORED int4range column with
 *      a GiST index — Prisma's query builder has no representation for
 *      range-overlap (`&&`), so a raw query is required either way.
 *   2. Keeping ONE implementation of "what counts as occupied" (tickets in
 *      an active status OR locks that are active and unexpired, overlapping
 *      the requested range) means the API layer and any direct SQL/PostgREST
 *      caller can never disagree about availability.
 */
export async function getSegmentSeatMap(params: {
  tripId: TripId;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
}): Promise<SegmentSeatMap> {
  const { tripId, originRouteStopId, destinationRouteStopId } = params;

  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: { vehicle: true },
  });

  const [origin, destination] = await Promise.all([
    prisma.routeStop.findUniqueOrThrow({ where: { id: originRouteStopId } }),
    prisma.routeStop.findUniqueOrThrow({ where: { id: destinationRouteStopId } }),
  ]);

  if (origin.routeId !== trip.routeId || destination.routeId !== trip.routeId) {
    throw new InvalidSegmentOrderError("origin/destination must belong to the trip's route");
  }
  if (destination.orderIndex <= origin.orderIndex) {
    throw new InvalidSegmentOrderError();
  }

  const rows = await prisma.$queryRaw<
    SegmentAvailabilityRow[]
  >`select * from get_segment_seat_availability(${tripId}::uuid, ${originRouteStopId}::uuid, ${destinationRouteStopId}::uuid)`;

  const seats: SeatAvailability[] = rows.map(toSeatAvailability);

  const segment: ResolvedSegment = {
    tripId,
    originRouteStopId,
    destinationRouteStopId,
    originOrderIndex: origin.orderIndex,
    destinationOrderIndex: destination.orderIndex,
  };

  const priceParams = { routeId: trip.routeId as never, originRouteStopId, destinationRouteStopId, onDate: trip.departureAt };
  const [standardPrice, premiumPrice] = await Promise.all([
    tryGetPrice({ ...priceParams, fareClass: "standard" }),
    tryGetPrice({ ...priceParams, fareClass: "premium" }),
  ]);

  return {
    trip: { id: trip.id as TripId, departure_at: trip.departureAt.toISOString(), status: trip.status, currency: trip.currency },
    segment,
    vehicleLayout: trip.vehicle.seatLayout as unknown as SegmentSeatMap["vehicleLayout"],
    seats,
    standardPrice,
    premiumPrice,
  };
}

/** True/false shortcut for the single-seat checkout path (skip the full seat map fetch). */
export async function isSeatAvailableForSegment(params: {
  tripId: TripId;
  seatId: string;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
}): Promise<boolean> {
  const map = await getSegmentSeatMap(params);
  return map.seats.some((s) => s.seatId === params.seatId && s.isAvailable);
}

/**
 * Order-index-keyed sibling of `getSegmentSeatMap` — the algorithmic core of
 * segment availability, with none of the pricing/vehicle-layout payload.
 * Callers that already have order indices in hand (trip search computing
 * "N seats left" for a result row, an internal batch job, a third-party
 * integration) skip resolving route_stop UUIDs entirely.
 *
 * Every input is validated before it ever reaches SQL — a missing trip, a
 * non-integer, an inverted or self-referential range, or an order_index
 * that doesn't exist on this trip's route all fail here with a specific,
 * typed error rather than reaching `get_available_seats_for_segment` at
 * all. The SQL function re-validates the same things independently (see
 * migration 0003) so a caller going straight to Postgres/RPC gets the same
 * guarantees — this is defense in depth, not the only line of defense.
 */
export async function getAvailableSeatsForSegment(
  tripId: TripId,
  startStopOrder: number,
  endStopOrder: number
): Promise<SeatAvailability[]> {
  if (!Number.isInteger(startStopOrder) || !Number.isInteger(endStopOrder) || startStopOrder < 0 || endStopOrder < 0) {
    throw new InvalidSegmentOrderError("startStopOrder/endStopOrder must be non-negative integers");
  }
  if (endStopOrder <= startStopOrder) {
    throw new InvalidSegmentOrderError();
  }

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { id: true, routeId: true } });
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  const matchingStops = await prisma.routeStop.findMany({
    where: { routeId: trip.routeId, orderIndex: { in: [startStopOrder, endStopOrder] } },
    select: { orderIndex: true },
  });
  const foundOrders = new Set(matchingStops.map((s) => s.orderIndex));
  const missing = [startStopOrder, endStopOrder].filter((o) => !foundOrders.has(o));
  if (missing.length > 0) {
    throw new StopOrderNotFoundError(trip.routeId, missing);
  }

  const rows = await prisma.$queryRaw<
    SegmentAvailabilityRow[]
  >`select * from get_available_seats_for_segment(${tripId}::uuid, ${startStopOrder}::int, ${endStopOrder}::int)`;

  return rows.map(toSeatAvailability);
}

/** Boolean convenience wrapper — "is THIS seat free for THIS segment", the
 * literal question a checkout pre-flight check needs answered without the
 * caller having to filter the full seat list itself. */
export async function isSeatFreeForSegment(
  tripId: TripId,
  seatId: SeatId,
  startStopOrder: number,
  endStopOrder: number
): Promise<boolean> {
  const seats = await getAvailableSeatsForSegment(tripId, startStopOrder, endStopOrder);
  return seats.some((s) => s.seatId === seatId && s.isAvailable);
}
