import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSegmentSeatMap } from "@/lib/services/availability.service";
import { InvalidSegmentOrderError } from "@/lib/services/pricing.service";
import type { ApiResult, SegmentSeatMap } from "@/types/database";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  originRouteStopId: z.string().uuid(),
  destinationRouteStopId: z.string().uuid(),
});

/**
 * GET /api/trips/:tripId/seats?originRouteStopId=...&destinationRouteStopId=...
 *
 * Returns the full seat map for the vehicle assigned to this trip, with
 * per-seat availability computed for the requested segment only. This is
 * what proves seat 12 booked for stops 1->3 renders as available here when
 * queried for 3->6 on the identical trip.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
): Promise<NextResponse<ApiResult<SegmentSeatMap>>> {
  const { tripId } = await params;
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid segment", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  try {
    const seatMap = await getSegmentSeatMap({
      tripId: tripId as never,
      originRouteStopId: parsed.data.originRouteStopId as never,
      destinationRouteStopId: parsed.data.destinationRouteStopId as never,
    });
    return NextResponse.json({ ok: true, data: seatMap });
  } catch (err) {
    if (err instanceof InvalidSegmentOrderError) {
      return NextResponse.json({ ok: false, error: { code: "SEGMENT_INVALID_ORDER", message: err.message } }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Trip or route stop not found" } }, { status: 404 });
  }
}
