import "server-only";

import { prisma } from "@/lib/prisma";
import type { FareClass, PriceQuote, RouteId, RouteStopId } from "@/types/database";

export class SegmentNotSellableError extends Error {
  constructor(message = "No active price exists for this origin/destination pair") {
    super(message);
    this.name = "SegmentNotSellableError";
  }
}

export class InvalidSegmentOrderError extends Error {
  constructor(message = "destination must come after origin along the route") {
    super(message);
    this.name = "InvalidSegmentOrderError";
  }
}

/**
 * Differential matrix pricing lookup: price is a function of
 * (route, origin route_stop, destination route_stop, fare class), not a flat
 * per-trip fare. Mirrors get_segment_price() in the SQL migration — kept in
 * sync deliberately so app-level and DB-level pricing never diverge.
 */
export async function getSegmentPrice(params: {
  routeId: RouteId;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
  fareClass?: FareClass;
  onDate?: Date;
}): Promise<PriceQuote> {
  const { routeId, originRouteStopId, destinationRouteStopId, fareClass = "standard", onDate = new Date() } = params;

  const [origin, destination] = await Promise.all([
    prisma.routeStop.findUniqueOrThrow({ where: { id: originRouteStopId } }),
    prisma.routeStop.findUniqueOrThrow({ where: { id: destinationRouteStopId } }),
  ]);

  if (origin.routeId !== routeId || destination.routeId !== routeId) {
    throw new InvalidSegmentOrderError("origin/destination route_stop_id must belong to routeId");
  }
  if (destination.orderIndex <= origin.orderIndex) {
    throw new InvalidSegmentOrderError();
  }

  const row = await prisma.segmentPricingMatrix.findFirst({
    where: {
      routeId,
      originRouteStopId,
      destinationRouteStopId,
      fareClass,
      isActive: true,
      validFrom: { lte: onDate },
      OR: [{ validUntil: null }, { validUntil: { gte: onDate } }],
    },
    orderBy: { validFrom: "desc" },
  });

  if (!row) {
    throw new SegmentNotSellableError();
  }

  return {
    routeId,
    originRouteStopId,
    destinationRouteStopId,
    fareClass,
    amount: Number(row.priceAmount),
    currency: row.currency,
  };
}

/**
 * Bulk variant for search results / matrix admin views — avoids N+1 lookups
 * when pricing every reachable destination from a single origin on a route.
 */
export async function getSegmentPricesFromOrigin(params: {
  routeId: RouteId;
  originRouteStopId: RouteStopId;
  fareClass?: FareClass;
  onDate?: Date;
}): Promise<PriceQuote[]> {
  const { routeId, originRouteStopId, fareClass = "standard", onDate = new Date() } = params;

  const rows = await prisma.segmentPricingMatrix.findMany({
    where: {
      routeId,
      originRouteStopId,
      fareClass,
      isActive: true,
      validFrom: { lte: onDate },
      OR: [{ validUntil: null }, { validUntil: { gte: onDate } }],
    },
    orderBy: { destinationRouteStopId: "asc" },
  });

  return rows.map((row) => ({
    routeId,
    originRouteStopId,
    destinationRouteStopId: row.destinationRouteStopId as RouteStopId,
    fareClass,
    amount: Number(row.priceAmount),
    currency: row.currency,
  }));
}
