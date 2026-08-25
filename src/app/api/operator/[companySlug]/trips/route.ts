import { NextRequest, NextResponse } from "next/server";
import { resolveOperatorCompany, listOperatorTrips, OperatorNotFoundError } from "@/lib/services/operator.service";
import type { ApiResult, OperatorTripSummary } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/operator/:companySlug/trips — most recent 50 trips, newest departure first. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
): Promise<NextResponse<ApiResult<OperatorTripSummary[]>>> {
  const { companySlug } = await params;
  try {
    const company = await resolveOperatorCompany(companySlug);
    const trips = await listOperatorTrips(company.id);
    return NextResponse.json({ ok: true, data: trips });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}
