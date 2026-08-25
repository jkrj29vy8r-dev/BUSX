import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAvailableSeatsForSegment,
  StopOrderNotFoundError,
  TripNotFoundError,
} from "@/lib/services/availability.service";
import { InvalidSegmentOrderError } from "@/lib/services/pricing.service";
import type { ApiResult, SeatAvailability } from "@/types/database";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  startStopOrder: z.coerce.number().int().min(0),
  endStopOrder: z.coerce.number().int().min(0),
});

interface SegmentAvailabilityResponse {
  seats: SeatAvailability[];
  availableCount: number;
  totalCount: number;
}

/**
 * GET /api/trips/:tripId/segment-availability?startStopOrder=0&endStopOrder=3
 *
 * The lightweight, order-index-keyed counterpart to
 * `/api/trips/:tripId/seats` — no route_stop UUID resolution, no pricing, no
 * vehicle layout. Built for callers that only need "how many/which seats are
 * free for this leg" (search result seat counts, internal tooling, a
 * third-party integration that already tracks stops by position).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
): Promise<NextResponse<ApiResult<SegmentAvailabilityResponse>>> {
  const { tripId } = await params;
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid startStopOrder/endStopOrder", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  try {
    const seats = await getAvailableSeatsForSegment(tripId as never, parsed.data.startStopOrder, parsed.data.endStopOrder);
    return NextResponse.json({
      ok: true,
      data: { seats, availableCount: seats.filter((s) => s.isAvailable).length, totalCount: seats.length },
    });
  } catch (err) {
    if (err instanceof TripNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    if (err instanceof StopOrderNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "STOP_ORDER_NOT_FOUND", message: err.message } }, { status: 404 });
    }
    if (err instanceof InvalidSegmentOrderError) {
      return NextResponse.json({ ok: false, error: { code: "SEGMENT_INVALID_ORDER", message: err.message } }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to compute segment availability" } }, { status: 500 });
  }
}
