import { NextRequest, NextResponse } from "next/server";
import { resolveOperatorCompany, getOperatorVehicleDetail, OperatorNotFoundError } from "@/lib/services/operator.service";
import type { ApiResult, OperatorVehicleDetail } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/operator/:companySlug/fleet/:vehicleId — loads a vehicle back into the builder for editing. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; vehicleId: string }> }
): Promise<NextResponse<ApiResult<OperatorVehicleDetail>>> {
  const { companySlug, vehicleId } = await params;
  try {
    const company = await resolveOperatorCompany(companySlug);
    const vehicle = await getOperatorVehicleDetail(company.id, vehicleId as never);
    return NextResponse.json({ ok: true, data: vehicle });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}
