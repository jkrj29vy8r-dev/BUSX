import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalUserId } from "@/lib/supabase/get-optional-user";
import { createSeatLock, releaseSeatLock, SeatAlreadyLockedError } from "@/lib/services/seat-lock.service";
import { InvalidSegmentOrderError } from "@/lib/services/pricing.service";
import type { ApiResult, SeatLockResult } from "@/types/database";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  tripId: z.string().uuid(),
  seatId: z.string().uuid(),
  originRouteStopId: z.string().uuid(),
  destinationRouteStopId: z.string().uuid(),
  sessionId: z.string().min(8).max(128),
});

/**
 * POST /api/seat-locks — acquire a 10-minute hold on one seat for one
 * segment. Frontend should call this the instant a seat is tapped on the
 * seat map, then subscribe to Supabase Realtime on `seat_locks` (filtered
 * by trip_id) so every other viewer's seat map greys the seat out live.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<SeatLockResult>>> {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid seat lock request", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const userId = await getOptionalUserId();

  try {
    const result = await createSeatLock({
      tripId: parsed.data.tripId as never,
      seatId: parsed.data.seatId as never,
      originRouteStopId: parsed.data.originRouteStopId as never,
      destinationRouteStopId: parsed.data.destinationRouteStopId as never,
      sessionId: parsed.data.sessionId,
      lockedByUserId: (userId as never) ?? undefined,
    });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (err) {
    if (err instanceof SeatAlreadyLockedError) {
      return NextResponse.json({ ok: false, error: { code: "SEAT_UNAVAILABLE", message: err.message } }, { status: 409 });
    }
    if (err instanceof InvalidSegmentOrderError) {
      return NextResponse.json({ ok: false, error: { code: "SEGMENT_INVALID_ORDER", message: err.message } }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to create seat lock" } }, { status: 500 });
  }
}

const releaseSchema = z.object({
  lockId: z.string().uuid(),
  sessionId: z.string().min(8).max(128),
});

/** DELETE /api/seat-locks — release a hold early (passenger deselects a seat). */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResult<{ released: true }>>> {
  const body = await request.json().catch(() => null);
  const parsed = releaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid release request", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  await releaseSeatLock(parsed.data.lockId as never, { sessionId: parsed.data.sessionId });
  return NextResponse.json({ ok: true, data: { released: true } });
}
