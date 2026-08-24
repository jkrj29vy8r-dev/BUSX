import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResult, TripDetail } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/trips/:tripId — trip + company + vehicle + the full ordered route_stops list with real scheduled times, for the trip detail / seat-selection page's route timeline. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
): Promise<NextResponse<ApiResult<TripDetail>>> {
  const { tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      company: true,
      vehicle: true,
      route: { include: { routeStops: { include: { stop: true }, orderBy: { orderIndex: "asc" } } } },
    },
  });

  if (!trip) {
    return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Trip not found" } }, { status: 404 });
  }

  const stops = trip.route.routeStops.map((rs) => ({
    routeStopId: rs.id as never,
    stopId: rs.stopId as never,
    name: rs.stop.name,
    city: rs.stop.city,
    orderIndex: rs.orderIndex,
    scheduledArrival: new Date(trip.departureAt.getTime() + rs.arrivalOffsetMinutes * 60_000).toISOString(),
    scheduledDeparture: new Date(trip.departureAt.getTime() + rs.departureOffsetMinutes * 60_000).toISOString(),
  }));

  return NextResponse.json({
    ok: true,
    data: {
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
      vehicle: {
        id: trip.vehicle.id as never,
        vehicle_type: trip.vehicle.vehicleType,
        seat_layout: trip.vehicle.seatLayout as never,
      },
      stops,
    },
  });
}
