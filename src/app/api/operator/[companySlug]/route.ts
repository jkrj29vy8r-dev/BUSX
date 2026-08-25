import { NextRequest, NextResponse } from "next/server";
import { resolveOperatorCompany, OperatorNotFoundError } from "@/lib/services/operator.service";
import type { ApiResult, OperatorCompanySummary } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/operator/:companySlug — resolves the dashboard's tenant, used by the sidebar shell. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
): Promise<NextResponse<ApiResult<OperatorCompanySummary>>> {
  const { companySlug } = await params;
  try {
    const company = await resolveOperatorCompany(companySlug);
    return NextResponse.json({ ok: true, data: company });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}
