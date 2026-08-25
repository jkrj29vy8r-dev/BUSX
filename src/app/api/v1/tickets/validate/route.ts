import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyBoardingScan } from "@/lib/services/ticket.service";
import { prisma } from "@/lib/prisma";
import type { ApiResult, BoardingScanResult } from "@/types/database";

// The signing/verification path uses node:crypto (HMAC-SHA256) directly —
// this route cannot run on the Edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  qrString: z.string().min(1, "qrString is required").max(4096, "qrString exceeds maximum length"),
  tripId: z.string().uuid("tripId must be a UUID"),
});

/**
 * POST /api/v1/tickets/validate
 *
 * Stable, versioned ticket-validation contract for the driver mobile
 * scanner — a native app or dedicated handheld hardware scanner, as opposed
 * to `/api/operator/:companySlug/trips/:tripId/scan`, which is what this
 * repo's own in-browser conductor UI calls. Both routes delegate to the
 * exact same `verifyBoardingScan` service function; there is one
 * implementation of "is this a real, boardable ticket for this trip", not
 * two that could quietly drift apart.
 *
 * `tripId` is mandatory and is NOT trusted from the QR payload itself —
 * the payload's own tripId only proves what the ticket was issued for, not
 * what trip this scanner is currently boarding. The caller (the scanner
 * device / app) asserts that independently, exactly like the operator-scoped
 * route does; `verifyBoardingScan` rejects a signature-valid ticket for any
 * *other* trip with `reason: "wrong_trip"`. companyId is derived from the
 * trip row server-side, never accepted from the client.
 *
 * Performance: both lookups inside this path are indexed point reads (trip
 * by primary key, ticket by primary key via the signed payload's ticketId)
 * — no table scans, no N+1. A rejected signature short-circuits before any
 * database access at all (`verifyBoardingScan` -> `verifyTicketQrOnServer`
 * recomputes the HMAC first and returns immediately on mismatch).
 *
 * Auth: this route intentionally has no bearer-token/API-key check in this
 * environment, matching every other operator/conductor-facing route in this
 * codebase — there is no live Supabase Auth project behind this build to
 * issue or verify one (see the operator dashboard's slug-scoped-URL
 * pattern). A real deployment MUST put a per-device or per-driver API key
 * (minted at vehicle/driver provisioning time) in front of this endpoint
 * before it is reachable from the public internet; this is a documented gap,
 * not a silent one.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<BoardingScanResult>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" } },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid request", details: parsed.error.flatten() } },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const { qrString, tripId } = parsed.data;

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { id: true, companyId: true } });
    if (!trip) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: `Trip ${tripId} not found` } },
        { status: 404, headers: { "cache-control": "no-store" } }
      );
    }

    const result = await verifyBoardingScan({
      qrString,
      expectedTripId: trip.id as never,
      expectedCompanyId: trip.companyId as never,
    });

    // A rejected ticket (bad signature, wrong trip, already boarded, ...)
    // is a normal, expected outcome the scanner UI renders — not a server
    // error. Only request-level problems (bad input, missing trip, an
    // actual exception) get a non-2xx status.
    return NextResponse.json({ ok: true, data: result }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Ticket validation failed" } },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
