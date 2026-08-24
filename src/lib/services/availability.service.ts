import "server-only";

import { prisma } from "@/lib/prisma";
import { InvalidSegmentOrderError } from "@/lib/services/pricing.service";
import type {
  ResolvedSegment,
  RouteStopId,
  SeatAvailability,
  SegmentSeatMap,
  TripId,
} from "@/types/database";

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
    Array<{
      seat_id: string;
      seat_number: string;
      row_number: number;
      col_position: number;
      deck: number;
      seat_type: string;
      is_available: boolean;
    }>
  >`select * from get_segment_seat_availability(${tripId}::uuid, ${originRouteStopId}::uuid, ${destinationRouteStopId}::uuid)`;

  const seats: SeatAvailability[] = rows.map((r) => ({
    seatId: r.seat_id as SeatAvailability["seatId"],
    seatNumber: r.seat_number,
    rowNumber: r.row_number,
    colPosition: r.col_position,
    deck: r.deck,
    seatType: r.seat_type as SeatAvailability["seatType"],
    isAvailable: r.is_available,
  }));

  const segment: ResolvedSegment = {
    tripId,
    originRouteStopId,
    destinationRouteStopId,
    originOrderIndex: origin.orderIndex,
    destinationOrderIndex: destination.orderIndex,
  };

  return {
    trip: { id: trip.id as TripId, departure_at: trip.departureAt.toISOString(), status: trip.status, currency: trip.currency },
    segment,
    vehicleLayout: trip.vehicle.seatLayout as unknown as SegmentSeatMap["vehicleLayout"],
    seats,
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
