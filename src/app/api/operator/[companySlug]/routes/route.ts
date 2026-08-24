import { NextRequest, NextResponse } from "next/server";
import { resolveOperatorCompany, listOperatorRoutes, OperatorNotFoundError } from "@/lib/services/operator.service";
import type { ApiResult, OperatorRouteSummary } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/operator/:companySlug/routes — this carrier's routes. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
): Promise<NextResponse<ApiResult<OperatorRouteSummary[]>>> {
  const { companySlug } = await params;
  try {
    const company = await resolveOperatorCompany(companySlug);
    const routes = await listOperatorRoutes(company.id);
    return NextResponse.json({ ok: true, data: routes });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}
