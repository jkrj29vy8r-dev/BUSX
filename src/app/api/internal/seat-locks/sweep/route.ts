import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sweepExpiredSeatLocks } from "@/lib/services/seat-lock.service";
import type { ApiResult } from "@/types/database";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.INTERNAL_CRON_SECRET;
  // Fail CLOSED: an unset secret means "reject everything", never "allow
  // everything". A misconfigured deployment should be a 503 for whoever
  // wired the cron job to notice, not a silently-open maintenance endpoint.
  if (!expected) return false;

  const provided = request.headers.get("x-internal-cron-secret");
  if (!provided) return false;

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  // Length check first — timingSafeEqual throws on mismatched lengths
  // rather than returning false, and the length check itself doesn't leak
  // anything an attacker doesn't already know (secret length isn't secret).
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * POST /api/internal/seat-locks/sweep
 *
 * The production "auto-release on session expiry" trigger: flips every
 * active-but-past-TTL seat_lock to 'expired' via `release_expired_seat_locks()`
 * (0001_init_busx_core.sql). Meant to be hit every 1-2 minutes by an external
 * scheduler — Vercel Cron, a Supabase Edge Function on a schedule, or
 * pg_cron directly on projects where that extension is enabled (see the
 * guarded `DO` block in 0003_segment_availability_core_and_lock_maintenance.sql).
 *
 * This is a belt-and-suspenders mechanism, not the thing correctness relies
 * on: `get_available_seats_for_segment` already treats a lock as free the
 * instant `expires_at` passes regardless of whether this has run (see that
 * migration's header comment), and `createSeatLock` sweeps opportunistically
 * before every insert. Nothing goes stale from the passenger's point of view
 * if this route is never called — it only keeps the `seat_locks` table
 * itself from accumulating rows the GiST exclusion constraint still
 * considers 'active' long after they stopped mattering.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<{ releasedCount: number }>>> {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid x-internal-cron-secret" } },
      { status: 401 }
    );
  }

  try {
    const releasedCount = await sweepExpiredSeatLocks();
    return NextResponse.json({ ok: true, data: { releasedCount } });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Sweep failed" } }, { status: 500 });
  }
}
