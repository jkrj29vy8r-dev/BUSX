import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveOperatorCompany,
  setManifestCheckIn,
  OperatorNotFoundError,
  InvalidCheckInTransitionError,
} from "@/lib/services/operator.service";
import type { ApiResult } from "@/types/database";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ checkedIn: z.boolean() });

/** PATCH /api/operator/:companySlug/trips/:tripId/manifest/:ticketId — the manifest's 1-click check-in toggle. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; tripId: string; ticketId: string }> }
): Promise<NextResponse<ApiResult<{ status: string }>>> {
  const { companySlug, tripId, ticketId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: "Expected { checkedIn: boolean }" } }, { status: 400 });
  }

  try {
    const company = await resolveOperatorCompany(companySlug);
    const status = await setManifestCheckIn(company.id, tripId as never, ticketId as never, parsed.data.checkedIn);
    return NextResponse.json({ ok: true, data: { status } });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    if (err instanceof InvalidCheckInTransitionError) {
      return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: err.message } }, { status: 409 });
    }
    throw err;
  }
}
