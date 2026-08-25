import { NextRequest, NextResponse } from "next/server";
import { resolveOperatorCompany, getOperatorOverview, OperatorNotFoundError } from "@/lib/services/operator.service";
import type { ApiResult, OperatorOverview } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/operator/:companySlug/overview — today's KPIs + next departures. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
): Promise<NextResponse<ApiResult<OperatorOverview>>> {
  const { companySlug } = await params;
  try {
    const company = await resolveOperatorCompany(companySlug);
    const overview = await getOperatorOverview(company.id);
    return NextResponse.json({ ok: true, data: { company, ...overview } });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}
