import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSegmentPrice, SegmentNotSellableError } from "@/lib/services/pricing.service";
import type { ApiResult, TripSearchResult } from "@/types/database";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  originStopId: z.string().uuid(),
  destinationStopId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fareClass: z.enum(["standard", "premium", "student", "senior"]).default("standard"),
});

/**
 * GET /api/trips/search?originStopId=...&destinationStopId=...&date=YYYY-MM-DD
 *
 * Finds trips whose route visits originStopId BEFORE destinationStopId
 * (order_index comparison — this is what makes a search across a >2-stop
 * route like Târgu Neamț → Bacău → Otopeni → București work: a passenger
 * searching Bacău → Otopeni matches trips whose route merely passes through
 * both, regardless of the route's full endpoint list), departing on the
 * requested calendar day, and prices + counts availability per result.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResult<TripSearchResult[]>>> {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid search parameters", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }
  const { originStopId, destinationStopId, date, fareClass } = parsed.data;

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  // Candidate route_stops for origin/destination across ALL routes, joined
  // so we only keep pairs where origin.order_index < destination.order_index
  // on the SAME route — i.e. the route actually travels that direction.
  const candidates = await prisma.$queryRaw<
    Array<{
      route_id: string;
      origin_route_stop_id: string;
      destination_route_stop_id: string;
      origin_offset_minutes: number;
      destination_offset_minutes: number;
    }>
  >`
    select
      o.route_id as route_id,
      o.id as origin_route_stop_id,
      d.id as destination_route_stop_id,
      o.departure_offset_minutes as origin_offset_minutes,
      d.arrival_offset_minutes as destination_offset_minutes
    from route_stops o
    join route_stops d on d.route_id = o.route_id and d.order_index > o.order_index
    where o.stop_id = ${originStopId}::uuid
      and d.stop_id = ${destinationStopId}::uuid
  `;

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, data: [] });
  }

  const routeIds = [...new Set(candidates.map((c) => c.route_id))];

  const routeStopStats = await prisma.routeStop.groupBy({
    by: ["routeId"],
    where: { routeId: { in: routeIds } },
    _min: { orderIndex: true },
    _max: { orderIndex: true },
    _count: { _all: true },
  });
  const statsByRoute = new Map(routeStopStats.map((s) => [s.routeId, s]));

  const trips = await prisma.trip.findMany({
    where: {
      routeId: { in: routeIds },
      departureAt: { gte: dayStart, lte: dayEnd },
      status: { in: ["scheduled", "boarding", "delayed"] },
    },
    include: { company: true, route: true, vehicle: true },
    orderBy: { departureAt: "asc" },
  });

  const results: TripSearchResult[] = [];

  for (const trip of trips) {
    const candidate = candidates.find((c) => c.route_id === trip.routeId);
    if (!candidate) continue;

    let price;
    try {
      price = await getSegmentPrice({
        routeId: trip.routeId as never,
        originRouteStopId: candidate.origin_route_stop_id as never,
        destinationRouteStopId: candidate.destination_route_stop_id as never,
        fareClass,
        onDate: trip.departureAt,
      });
    } catch (err) {
      if (err instanceof SegmentNotSellableError) continue; // not sellable on this trip; skip silently
      throw err;
    }

    const seatMapRows = await prisma.$queryRaw<Array<{ is_available: boolean }>>`
      select is_available from get_segment_seat_availability(
        ${trip.id}::uuid, ${candidate.origin_route_stop_id}::uuid, ${candidate.destination_route_stop_id}::uuid
      )
    `;
    const availableSeatsCount = seatMapRows.filter((r) => r.is_available).length;
    if (availableSeatsCount === 0) continue;

    const [originStop, destinationStop] = await Promise.all([
      prisma.routeStop.findUniqueOrThrow({ where: { id: candidate.origin_route_stop_id }, include: { stop: true } }),
      prisma.routeStop.findUniqueOrThrow({ where: { id: candidate.destination_route_stop_id }, include: { stop: true } }),
    ]);
    const stats = statsByRoute.get(trip.routeId);

    const scheduledDeparture = new Date(trip.departureAt.getTime() + candidate.origin_offset_minutes * 60_000);
    const scheduledArrival = new Date(trip.departureAt.getTime() + candidate.destination_offset_minutes * 60_000);

    results.push({
      trip: {
        id: trip.id as never,
        route_id: trip.routeId as never,
        vehicle_id: trip.vehicleId as never,
        company_id: trip.companyId as never,
        driver_id: trip.driverId as never,
        conductor_id: trip.conductorId as never,
        departure_at: trip.departureAt.toISOString(),
        status: trip.status,
        currency: trip.currency,
        created_at: trip.createdAt.toISOString(),
        updated_at: trip.updatedAt.toISOString(),
      },
      company: {
        id: trip.company.id as never,
        name: trip.company.name,
        slug: trip.company.slug,
        logo_url: trip.company.logoUrl,
        brand_primary_color: trip.company.brandPrimaryColor as never,
        is_verified: trip.company.isVerified,
      },
      route: { id: trip.route.id as never, name: trip.route.name },
      origin: {
        routeStopId: originStop.id as never,
        stopId: originStop.stopId as never,
        name: originStop.stop.name,
        city: originStop.stop.city,
        orderIndex: originStop.orderIndex,
        scheduledDeparture: scheduledDeparture.toISOString(),
        scheduledArrival: scheduledDeparture.toISOString(),
      },
      destination: {
        routeStopId: destinationStop.id as never,
        stopId: destinationStop.stopId as never,
        name: destinationStop.stop.name,
        city: destinationStop.stop.city,
        orderIndex: destinationStop.orderIndex,
        scheduledDeparture: scheduledArrival.toISOString(),
        scheduledArrival: scheduledArrival.toISOString(),
      },
      routeStopCount: stats?._count._all ?? 2,
      routeStartOrderIndex: stats?._min.orderIndex ?? originStop.orderIndex,
      routeEndOrderIndex: stats?._max.orderIndex ?? destinationStop.orderIndex,
      price,
      availableSeatsCount,
      vehicleType: trip.vehicle.vehicleType,
    });
  }

  return NextResponse.json({ ok: true, data: results });
}
