import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAndCheckInTicket } from "@/lib/services/ticket.service";
import type { ApiResult, TicketVerificationResult } from "@/types/database";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  qrString: z.string().min(1),
});

/**
 * POST /api/tickets/:ticketId/verify
 *
 * ONLINE verification + check-in, used by the conductor app when it has
 * connectivity. Recomputes the HMAC server-side (never trusts a `valid`
 * flag from the client) and, if the signature checks out and the ticket
 * hasn't already been checked in, flips it to 'checked_in'.
 *
 * The conductor app's OFFLINE path calls `verifyTicketQr()` from
 * `@/lib/crypto/ticket-hmac` directly on-device with a locally cached key
 * ring — no network required to prove authenticity — and queues the
 * check-in call to sync once connectivity returns. `:ticketId` in the path
 * is only used to correlate this call with client-side navigation; the
 * payload's own `ticketId` is authoritative.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
): Promise<NextResponse<ApiResult<TicketVerificationResult & { alreadyCheckedIn?: boolean }>>> {
  await params; // path segment is informational; see doc comment above
  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Missing qrString" } },
      { status: 400 }
    );
  }

  const result = await verifyAndCheckInTicket(parsed.data.qrString);
  if (!result.valid) {
    return NextResponse.json(
      { ok: false, error: { code: "TICKET_SIGNATURE_INVALID", message: `Ticket rejected: ${result.reason}` } },
      { status: 422 }
    );
  }

  return NextResponse.json({ ok: true, data: result });
}
