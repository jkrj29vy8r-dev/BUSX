import { NextRequest, NextResponse } from "next/server";
import { resolveOperatorCompany, getOperatorRouteDetail, OperatorNotFoundError } from "@/lib/services/operator.service";
import type { ApiResult, OperatorRouteDetail } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/operator/:companySlug/routes/:routeId — stops + the standard-fare pricing matrix. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; routeId: string }> }
): Promise<NextResponse<ApiResult<OperatorRouteDetail>>> {
  const { companySlug, routeId } = await params;
  try {
    const company = await resolveOperatorCompany(companySlug);
    const route = await getOperatorRouteDetail(company.id, routeId as never);
    return NextResponse.json({ ok: true, data: route });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}
