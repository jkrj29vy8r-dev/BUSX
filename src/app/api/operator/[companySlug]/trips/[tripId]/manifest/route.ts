import { NextRequest, NextResponse } from "next/server";
import { resolveOperatorCompany, getOperatorTripManifest, OperatorNotFoundError } from "@/lib/services/operator.service";
import type { ApiResult, OperatorTripManifest } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/operator/:companySlug/trips/:tripId/manifest — every booked passenger on this run. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; tripId: string }> }
): Promise<NextResponse<ApiResult<OperatorTripManifest>>> {
  const { companySlug, tripId } = await params;
  try {
    const company = await resolveOperatorCompany(companySlug);
    const manifest = await getOperatorTripManifest(company.id, tripId as never);
    return NextResponse.json({ ok: true, data: manifest });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}
