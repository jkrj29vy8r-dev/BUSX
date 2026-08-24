import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  CompanyId,
  FareClass,
  OperatorCompanySummary,
  OperatorOverview,
  OperatorPricingCell,
  OperatorRouteDetail,
  OperatorRouteStop,
  OperatorRouteSummary,
  OperatorTripSummary,
  RouteId,
  RouteStopId,
} from "@/types/database";

export class OperatorNotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "OperatorNotFoundError";
  }
}

export class InvalidPricingSegmentError extends Error {
  constructor(message = "destination must come after origin along the route") {
    super(message);
    this.name = "InvalidPricingSegmentError";
  }
}

const SOLD_STATUSES = ["reserved", "paid", "checked_in", "boarded"] as const;

function toCompanySummary(c: Awaited<ReturnType<typeof prisma.company.findUniqueOrThrow>>): OperatorCompanySummary {
  return {
    id: c.id as CompanyId,
    name: c.name,
    slug: c.slug,
    logoUrl: c.logoUrl,
    brandPrimaryColor: c.brandPrimaryColor as never,
    isVerified: c.isVerified,
    status: c.status,
  };
}

/** Every operator route handler resolves the company from the URL slug
 * first, then scopes every subsequent query to its id — that scoping is
 * the tenant boundary in this environment (see the type module's note on
 * why there's no live-session gate on top of it). */
export async function resolveOperatorCompany(slug: string): Promise<OperatorCompanySummary> {
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) throw new OperatorNotFoundError(`No company with slug "${slug}"`);
  return toCompanySummary(company);
}

export async function getOperatorOverview(companyId: CompanyId): Promise<Omit<OperatorOverview, "company">> {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [tripsToday, soldTickets, liveSeatLocks, upcomingTrips] = await Promise.all([
    prisma.trip.count({ where: { companyId, departureAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.ticket.findMany({
      where: { status: { in: [...SOLD_STATUSES] }, issuedAt: { gte: dayStart, lt: dayEnd }, trip: { companyId } },
      select: { priceAmount: true, currency: true },
    }),
    prisma.seatLock.count({ where: { status: "active", expiresAt: { gt: now }, trip: { companyId } } }),
    prisma.trip.findMany({
      where: { companyId, departureAt: { gte: now } },
      orderBy: { departureAt: "asc" },
      take: 8,
      include: {
        route: { select: { name: true } },
        vehicle: { select: { vehicleType: true, totalSeats: true } },
        _count: { select: { tickets: { where: { status: { in: [...SOLD_STATUSES] } } } } },
      },
    }),
  ]);

  const revenueToday = soldTickets.reduce((sum, t) => sum + Number(t.priceAmount), 0);
  const currency = soldTickets[0]?.currency ?? "RON";

  return {
    tripsToday,
    seatsSoldToday: soldTickets.length,
    revenueToday,
    currency,
    liveSeatLocks,
    upcomingDepartures: upcomingTrips.map((t) => ({
      tripId: t.id as never,
      routeName: t.route.name,
      departureAt: t.departureAt.toISOString(),
      vehicleType: t.vehicle.vehicleType,
      status: t.status,
      seatsSold: t._count.tickets,
      totalSeats: t.vehicle.totalSeats,
    })),
  };
}

export async function listOperatorRoutes(companyId: CompanyId): Promise<OperatorRouteSummary[]> {
  const routes = await prisma.route.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    include: {
      routeStops: { orderBy: { orderIndex: "asc" }, include: { stop: { select: { city: true } } } },
      _count: { select: { trips: { where: { departureAt: { gte: new Date() } } } } },
    },
  });

  return routes.map((r) => ({
    id: r.id as never,
    name: r.name,
    slug: r.slug,
    isActive: r.isActive,
    stopCount: r.routeStops.length,
    distanceKm: r.distanceKm ? Number(r.distanceKm) : null,
    upcomingTripCount: r._count.trips,
    firstStopCity: r.routeStops[0]?.stop.city ?? null,
    lastStopCity: r.routeStops[r.routeStops.length - 1]?.stop.city ?? null,
  }));
}

export async function getOperatorRouteDetail(companyId: CompanyId, routeId: RouteId): Promise<OperatorRouteDetail> {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      routeStops: { orderBy: { orderIndex: "asc" }, include: { stop: true } },
      pricingMatrix: { where: { fareClass: "standard", isActive: true } },
    },
  });

  if (!route || route.companyId !== companyId) {
    throw new OperatorNotFoundError("Route not found for this company");
  }

  const stops: OperatorRouteStop[] = route.routeStops.map((rs) => ({
    routeStopId: rs.id as never,
    stopId: rs.stopId as never,
    name: rs.stop.name,
    city: rs.stop.city,
    orderIndex: rs.orderIndex,
    arrivalOffsetMinutes: rs.arrivalOffsetMinutes,
    departureOffsetMinutes: rs.departureOffsetMinutes,
  }));

  const today = new Date();
  const activeByPair = new Map<string, (typeof route.pricingMatrix)[number]>();
  for (const row of route.pricingMatrix) {
    if (row.validFrom > today) continue;
    if (row.validUntil && row.validUntil < today) continue;
    const key = `${row.originRouteStopId}:${row.destinationRouteStopId}`;
    const existing = activeByPair.get(key);
    if (!existing || row.validFrom > existing.validFrom) activeByPair.set(key, row);
  }

  const pricingCells: OperatorPricingCell[] = [];
  for (const origin of stops) {
    for (const destination of stops) {
      if (destination.orderIndex <= origin.orderIndex) continue;
      const row = activeByPair.get(`${origin.routeStopId}:${destination.routeStopId}`);
      pricingCells.push({
        originRouteStopId: origin.routeStopId,
        destinationRouteStopId: destination.routeStopId,
        priceAmount: row ? Number(row.priceAmount) : null,
        currency: row?.currency ?? "RON",
      });
    }
  }

  return {
    id: route.id as never,
    name: route.name,
    slug: route.slug,
    isActive: route.isActive,
    distanceKm: route.distanceKm ? Number(route.distanceKm) : null,
    stops,
    pricingCells,
  };
}

/**
 * Upserts the *currently effective* price for one segment: if an active row
 * already covers today, its price is updated in place; otherwise a new row
 * is inserted effective today. (Scheduling a *future* price change — insert
 * without touching today's row — is a reasonable next step but a distinct
 * flow from "edit the matrix cell I'm looking at," which is what this
 * powers.) Mirrors the DB trigger's own order check so the UI gets the same
 * rejection message instead of a raw constraint violation.
 */
export async function updatePricingCell(
  companyId: CompanyId,
  routeId: RouteId,
  input: { originRouteStopId: RouteStopId; destinationRouteStopId: RouteStopId; fareClass: FareClass; priceAmount: number }
): Promise<OperatorPricingCell> {
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route || route.companyId !== companyId) {
    throw new OperatorNotFoundError("Route not found for this company");
  }

  const [origin, destination] = await Promise.all([
    prisma.routeStop.findUnique({ where: { id: input.originRouteStopId } }),
    prisma.routeStop.findUnique({ where: { id: input.destinationRouteStopId } }),
  ]);
  if (!origin || !destination || origin.routeId !== routeId || destination.routeId !== routeId) {
    throw new OperatorNotFoundError("Origin/destination stop not found on this route");
  }
  if (destination.orderIndex <= origin.orderIndex) {
    throw new InvalidPricingSegmentError();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.segmentPricingMatrix.findFirst({
    where: {
      routeId,
      originRouteStopId: input.originRouteStopId,
      destinationRouteStopId: input.destinationRouteStopId,
      fareClass: input.fareClass,
      isActive: true,
      validFrom: { lte: today },
      OR: [{ validUntil: null }, { validUntil: { gte: today } }],
    },
    orderBy: { validFrom: "desc" },
  });

  const row = existing
    ? await prisma.segmentPricingMatrix.update({ where: { id: existing.id }, data: { priceAmount: input.priceAmount } })
    : await prisma.segmentPricingMatrix.create({
        data: {
          routeId,
          originRouteStopId: input.originRouteStopId,
          destinationRouteStopId: input.destinationRouteStopId,
          fareClass: input.fareClass,
          priceAmount: input.priceAmount,
          validFrom: today,
        },
      });

  return {
    originRouteStopId: input.originRouteStopId,
    destinationRouteStopId: input.destinationRouteStopId,
    priceAmount: Number(row.priceAmount),
    currency: row.currency,
  };
}

export async function listOperatorTrips(companyId: CompanyId): Promise<OperatorTripSummary[]> {
  const trips = await prisma.trip.findMany({
    where: { companyId },
    orderBy: { departureAt: "desc" },
    take: 50,
    include: {
      route: { select: { name: true } },
      vehicle: { select: { vehicleType: true, totalSeats: true } },
      tickets: { where: { status: { in: [...SOLD_STATUSES] } }, select: { priceAmount: true, currency: true } },
    },
  });

  return trips.map((t) => ({
    id: t.id as never,
    routeName: t.route.name,
    vehicleType: t.vehicle.vehicleType,
    departureAt: t.departureAt.toISOString(),
    status: t.status,
    seatsSold: t.tickets.length,
    totalSeats: t.vehicle.totalSeats,
    revenue: t.tickets.reduce((sum, tk) => sum + Number(tk.priceAmount), 0),
    currency: t.tickets[0]?.currency ?? t.currency,
  }));
}
