import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalUserId } from "@/lib/supabase/get-optional-user";
import {
  issueTicketsForBooking,
  SeatLockExpiredError,
  SegmentAlreadyTicketedError,
} from "@/lib/services/ticket.service";
import type { ApiResult, CreateBookingResult } from "@/types/database";

export const dynamic = "force-dynamic";

const bookingSchema = z.object({
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  sessionId: z.string().min(8).max(128),
  paymentProvider: z.string().min(1),
  passengers: z
    .array(
      z.object({
        seatLockId: z.string().uuid(),
        fullName: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        fareClass: z.enum(["standard", "premium", "student", "senior"]),
      })
    )
    .min(1),
});

/**
 * POST /api/bookings
 *
 * Converts a set of active seat_locks into paid tickets. In production this
 * sits behind payment confirmation (called from a payment-provider webhook
 * handler or after client-side payment confirmation + server-side charge
 * verification) — it is intentionally NOT the place price is trusted from
 * the client; `issueTicketsForBooking` re-quotes every segment from
 * `segment_pricing_matrix` server-side.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<CreateBookingResult>>> {
  const body = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid booking request", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const userId = await getOptionalUserId();

  try {
    const result = await issueTicketsForBooking({
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      sessionId: parsed.data.sessionId,
      paymentProvider: parsed.data.paymentProvider,
      userId: (userId as never) ?? undefined,
      passengers: parsed.data.passengers.map((p) => ({
        seatLockId: p.seatLockId as never,
        fullName: p.fullName,
        phone: p.phone,
        email: p.email,
        fareClass: p.fareClass,
      })),
    });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (err) {
    if (err instanceof SeatLockExpiredError) {
      return NextResponse.json({ ok: false, error: { code: "LOCK_EXPIRED", message: err.message } }, { status: 409 });
    }
    if (err instanceof SegmentAlreadyTicketedError) {
      return NextResponse.json({ ok: false, error: { code: "SEAT_UNAVAILABLE", message: err.message } }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to issue tickets" } }, { status: 500 });
  }
}
