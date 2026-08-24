import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ApiResult, StopRow } from "@/types/database";

export const dynamic = "force-dynamic";

const querySchema = z.object({ q: z.string().trim().min(1).max(100) });

/** GET /api/stops/search?q=... — typeahead for the origin/destination pickers. */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResult<StopRow[]>>> {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ ok: true, data: [] });
  }

  const stops = await prisma.stop.findMany({
    where: {
      OR: [
        { name: { contains: parsed.data.q, mode: "insensitive" } },
        { city: { contains: parsed.data.q, mode: "insensitive" } },
        { stationCode: { contains: parsed.data.q, mode: "insensitive" } },
      ],
    },
    orderBy: { city: "asc" },
    take: 8,
  });

  return NextResponse.json({
    ok: true,
    data: stops.map((s) => ({
      id: s.id as never,
      name: s.name,
      city: s.city,
      county: s.county,
      country_code: s.countryCode,
      station_code: s.stationCode,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      timezone: s.timezone,
      is_airport: s.isAirport,
      created_at: s.createdAt.toISOString(),
      updated_at: s.updatedAt.toISOString(),
    })),
  });
}
