import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveOperatorCompany,
  getOperatorCompanyProfile,
  updateOperatorCompanyProfile,
  OperatorNotFoundError,
} from "@/lib/services/operator.service";
import type { ApiResult, OperatorCompanyProfile } from "@/types/database";

export const dynamic = "force-dynamic";

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color like #0066FF");

const bodySchema = z.object({
  legalName: z.string().max(200).nullable().optional(),
  fiscalCode: z.string().max(30).nullable().optional(),
  supportPhone: z.string().max(30).nullable().optional(),
  supportEmail: z.string().max(200).nullable().optional(),
  logoUrl: z.string().max(800_000).nullable().optional(), // data: URI, ~600KB binary cap — see route comment
  brandPrimaryColor: hex.optional(),
  brandSecondaryColor: hex.optional(),
  emergencyContacts: z
    .array(z.object({ name: z.string().min(1).max(100), phone: z.string().min(1).max(30), role: z.string().max(60) }))
    .max(10)
    .optional(),
});

/** GET/PATCH /api/operator/:companySlug/profile — the carrier onboarding form.
 *
 * `logoUrl` is stored as a data: URI directly in `companies.logo_url` (a
 * text column) rather than uploaded to object storage — there's no Supabase
 * Storage bucket provisioned in this environment. That makes this a real,
 * working upload (not a mock) up to the size cap enforced below; swapping
 * in a real bucket later only changes what this field's value looks like,
 * not the column or the form.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
): Promise<NextResponse<ApiResult<OperatorCompanyProfile>>> {
  const { companySlug } = await params;
  try {
    const company = await resolveOperatorCompany(companySlug);
    const profile = await getOperatorCompanyProfile(company.id);
    return NextResponse.json({ ok: true, data: profile });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
): Promise<NextResponse<ApiResult<OperatorCompanyProfile>>> {
  const { companySlug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile fields", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }
  if (parsed.data.logoUrl && !parsed.data.logoUrl.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: "logoUrl must be an image data URI" } }, { status: 400 });
  }

  try {
    const company = await resolveOperatorCompany(companySlug);
    const profile = await updateOperatorCompanyProfile(company.id, parsed.data as never);
    return NextResponse.json({ ok: true, data: profile });
  } catch (err) {
    if (err instanceof OperatorNotFoundError) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: err.message } }, { status: 404 });
    }
    throw err;
  }
}
