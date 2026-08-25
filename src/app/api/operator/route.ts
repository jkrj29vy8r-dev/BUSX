import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResult, OperatorCompanySummary } from "@/types/database";

export const dynamic = "force-dynamic";

/** GET /api/operator — every company, for the dashboard's entry-point picker
 * (see src/app/operator/page.tsx for why there's a picker instead of a
 * login redirect in this environment). */
export async function GET(): Promise<NextResponse<ApiResult<OperatorCompanySummary[]>>> {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({
    ok: true,
    data: companies.map((c) => ({
      id: c.id as never,
      name: c.name,
      slug: c.slug,
      logoUrl: c.logoUrl,
      brandPrimaryColor: c.brandPrimaryColor as never,
      isVerified: c.isVerified,
      status: c.status,
    })),
  });
}
