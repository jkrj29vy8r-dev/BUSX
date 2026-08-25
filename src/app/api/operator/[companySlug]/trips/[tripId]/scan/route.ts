import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveOperatorCompany, OperatorNotFoundError } from "@/lib/services/operator.service";
import { verifyBoardingScan } from "@/lib/services/ticket.service";
import { prisma } from "@/lib/prisma";
import type { ApiResult, BoardingScanResult } from "@/types/database";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ qrString: z.string().min(1).max(4000) });

/** POST /api/operator/:companySlug/trips/:tripId/scan — the conductor
 * scanner's verify call. Every scan re-resolves the trip against this
 * company (not just trusting the URL) so a scanner provisioned for one
 * carrier can never check a passenger into another carrier's trip, even
 * if it were pointed at the wrong tripId. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; tripId: string }> }
): Promise<NextResponse<ApiResult<BoardingScanResult>>> {
  const { companySlug, tripId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: "Missing qrString" } }, { status: 400 });
  }

  try {
    const company = await resolveOperatorCompany(companySlug);
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.companyId !== company.id) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Trip not found for this company" } }, { status: 404 });
    }

    const result = await verifyBoardingScan({
      qrString: parsed.data.qrString,
      expectedTripId: tripId as never,
      expectedCompanyId: company.id,
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}
