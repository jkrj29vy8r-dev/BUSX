import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveOperatorCompany,
  listOperatorFleet,
  saveOperatorVehicle,
  OperatorNotFoundError,
  VehicleHasBookingHistoryError,
  DuplicateRegistrationPlateError,
  EmptyVehicleLayoutError,
} from "@/lib/services/operator.service";
import type { ApiResult, OperatorFleetVehicleSummary, OperatorVehicleDetail } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/operator/:companySlug/fleet — every vehicle this carrier operates. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
): Promise<NextResponse<ApiResult<OperatorFleetVehicleSummary[]>>> {
  const { companySlug } = await params;
  try {
    const company = await resolveOperatorCompany(companySlug);
    const fleet = await listOperatorFleet(company.id);
    return NextResponse.json({ ok: true, data: fleet });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}

const seatSchema = z.object({
  seatNumber: z.string().min(1).max(10),
  rowNumber: z.number().int().min(0),
  colPosition: z.number().int().min(0),
  deck: z.number().int().min(1).default(1),
  seatType: z.enum(["standard", "premium", "disabled_access", "driver", "conductor"]),
});

const bodySchema = z.object({
  vehicleId: z.string().uuid().nullable(),
  registrationPlate: z.string().min(2).max(20),
  vehicleType: z.enum(["minibus_16", "sprinter_19", "isuzu_30", "coach_50", "double_decker_70", "custom"]),
  seatLayout: z.object({
    rows: z.number().int().min(1).max(30),
    cols: z.number().int().min(1).max(10),
    aisleAfterCol: z.number().int().min(0),
    deck: z.number().int().min(1),
    disabledCells: z.array(z.tuple([z.number().int(), z.number().int()])).optional(),
    fullWidthRows: z.array(z.number().int()).optional(),
    layoutMarkers: z.array(z.object({ row: z.number().int(), col: z.number().int(), kind: z.enum(["door", "toilet"]) })).optional(),
    layoutVersion: z.number().int(),
  }),
  seats: z.array(seatSchema).min(1).max(120),
});

/** POST /api/operator/:companySlug/fleet — the Fleet Builder's save action.
 * `vehicleId: null` creates a new vehicle; a real id replaces that
 * vehicle's entire seat layout (rejected once it has ticket history —
 * see saveOperatorVehicle's doc comment). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
): Promise<NextResponse<ApiResult<OperatorVehicleDetail>>> {
  const { companySlug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid vehicle layout", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  try {
    const company = await resolveOperatorCompany(companySlug);
    const vehicle = await saveOperatorVehicle(company.id, {
      vehicleId: parsed.data.vehicleId as never,
      registrationPlate: parsed.data.registrationPlate,
      vehicleType: parsed.data.vehicleType,
      seatLayout: parsed.data.seatLayout,
      seats: parsed.data.seats,
    });
    return NextResponse.json({ ok: true, data: vehicle }, { status: 201 });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    if (err instanceof VehicleHasBookingHistoryError || err instanceof DuplicateRegistrationPlateError || err instanceof EmptyVehicleLayoutError) {
      return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: err.message } }, { status: 409 });
    }
    throw err;
  }
}
