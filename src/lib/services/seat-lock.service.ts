import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { InvalidSegmentOrderError } from "@/lib/services/pricing.service";
import type { CreateSeatLockInput, SeatLockId, SeatLockResult } from "@/types/database";

const DEFAULT_TTL_SECONDS = 600; // 10 minutes

/** Postgres SQLSTATE for `exclude_violation` — raised by the GiST EXCLUDE
 * constraint on seat_locks when a requested segment overlaps an existing
 * active lock for the same (trip, seat). */
const EXCLUSION_VIOLATION = "23P01";

export class SeatAlreadyLockedError extends Error {
  constructor(message = "This seat is already held for an overlapping segment") {
    super(message);
    this.name = "SeatAlreadyLockedError";
  }
}

/**
 * Creates a temporary 10-minute hold on a seat for a specific segment.
 *
 * Concurrency safety does NOT rely on application-level check-then-insert:
 * the insert is submitted directly to Postgres, whose GiST EXCLUDE
 * constraint on seat_locks(trip_id, seat_id, segment_range) atomically
 * rejects any lock whose [origin, destination) range overlaps another
 * active, non-expired lock on the same seat/trip. We catch SQLSTATE 23P01
 * and translate it to a domain error — this is the only correct way to
 * prevent a race between two passengers locking the same seat/segment
 * simultaneously.
 */
export async function createSeatLock(input: CreateSeatLockInput): Promise<SeatLockResult> {
  const ttlSeconds = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  const [origin, destination] = await Promise.all([
    prisma.routeStop.findUniqueOrThrow({ where: { id: input.originRouteStopId } }),
    prisma.routeStop.findUniqueOrThrow({ where: { id: input.destinationRouteStopId } }),
  ]);
  if (destination.orderIndex <= origin.orderIndex) {
    throw new InvalidSegmentOrderError();
  }

  // Opportunistic housekeeping: flips any stale active locks to 'expired'
  // before we attempt the insert, so a lock that's technically past its TTL
  // but hasn't been swept yet doesn't spuriously block a new one.
  await prisma.$executeRaw`select release_expired_seat_locks()`;

  try {
    const lock = await prisma.seatLock.create({
      data: {
        tripId: input.tripId,
        seatId: input.seatId,
        originRouteStopId: input.originRouteStopId,
        destinationRouteStopId: input.destinationRouteStopId,
        originOrderIndex: origin.orderIndex,
        destinationOrderIndex: destination.orderIndex,
        sessionId: input.sessionId,
        lockedByUserId: input.lockedByUserId,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        status: "active",
      },
    });

    return { lock: toSeatLockRow(lock), expiresInSeconds: ttlSeconds };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2010") {
      const sqlState = (err.meta as { code?: string } | undefined)?.code;
      if (sqlState === EXCLUSION_VIOLATION) {
        throw new SeatAlreadyLockedError();
      }
    }
    // Prisma sometimes surfaces raw Postgres exclusion violations as P2002-like
    // unknown errors depending on driver adapter; fall back to a message match.
    if (err instanceof Error && err.message.includes(EXCLUSION_VIOLATION)) {
      throw new SeatAlreadyLockedError();
    }
    throw err;
  }
}

export async function releaseSeatLock(lockId: SeatLockId, opts: { sessionId?: string } = {}): Promise<void> {
  await prisma.seatLock.updateMany({
    where: {
      id: lockId,
      status: "active",
      ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
    },
    data: { status: "released" },
  });
}

/**
 * Bulk release for a whole checkout session — "auto-release on payment
 * failure / abandoned checkout" in one call, instead of the client tracking
 * every individual lockId it acquired. `issueTicketsForBooking` runs all of
 * a booking's tickets in a single transaction, so a failure there (an
 * expired lock, a raced exclusion violation, a declined payment) means NONE
 * of that session's locks were converted — every one of them is still
 * sitting on a 10-minute hold nobody can use until this is called or the
 * TTL naturally lapses. Scoped strictly to `status = 'active'` so it can
 * never touch a lock that already converted into a ticket or was already
 * released/expired by something else.
 */
export async function releaseSeatLocksForSession(sessionId: string): Promise<number> {
  const result = await prisma.seatLock.updateMany({
    where: { sessionId, status: "active" },
    data: { status: "released" },
  });
  return result.count;
}

/** Called by an Edge Function / pg_cron job every 1-2 min; also safe to call inline. */
export async function sweepExpiredSeatLocks(): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ release_expired_seat_locks: number }>>`
    select release_expired_seat_locks()
  `;
  return result[0]?.release_expired_seat_locks ?? 0;
}

function toSeatLockRow(lock: Awaited<ReturnType<typeof prisma.seatLock.create>>) {
  return {
    id: lock.id as SeatLockId,
    trip_id: lock.tripId,
    seat_id: lock.seatId,
    origin_route_stop_id: lock.originRouteStopId,
    destination_route_stop_id: lock.destinationRouteStopId,
    origin_order_index: lock.originOrderIndex,
    destination_order_index: lock.destinationOrderIndex,
    locked_by_user_id: lock.lockedByUserId,
    session_id: lock.sessionId,
    status: lock.status,
    expires_at: lock.expiresAt.toISOString(),
    created_at: lock.createdAt.toISOString(),
  } as import("@/types/database").SeatLockRow;
}
