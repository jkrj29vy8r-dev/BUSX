import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveOperatorCompany,
  updatePricingCell,
  OperatorNotFoundError,
  InvalidPricingSegmentError,
} from "@/lib/services/operator.service";
import type { ApiResult, OperatorPricingCell } from "@/types/database";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  originRouteStopId: z.string().uuid(),
  destinationRouteStopId: z.string().uuid(),
  fareClass: z.enum(["standard", "premium", "student", "senior"]).default("standard"),
  priceAmount: z.number().min(0).max(100_000),
});

/** PATCH /api/operator/:companySlug/routes/:routeId/pricing — upsert one segment_pricing_matrix cell. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; routeId: string }> }
): Promise<NextResponse<ApiResult<OperatorPricingCell>>> {
  const { companySlug, routeId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid price", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  try {
    const company = await resolveOperatorCompany(companySlug);
    const cell = await updatePricingCell(company.id, routeId as never, {
      originRouteStopId: parsed.data.originRouteStopId as never,
      destinationRouteStopId: parsed.data.destinationRouteStopId as never,
      fareClass: parsed.data.fareClass,
      priceAmount: parsed.data.priceAmount,
    });
    return NextResponse.json({ ok: true, data: cell });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    if (err instanceof InvalidPricingSegmentError) {
      return NextResponse.json({ ok: false, error: { code: "SEGMENT_INVALID_ORDER", message: err.message } }, { status: 400 });
    }
    throw err;
  }
}
