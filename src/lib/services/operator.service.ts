import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  CompanyId,
  EmergencyContact,
  FareClass,
  OperatorCompanyProfile,
  OperatorCompanySummary,
  OperatorFleetVehicleSummary,
  OperatorManifestEntry,
  OperatorOverview,
  OperatorPricingCell,
  OperatorRouteDetail,
  OperatorRouteStop,
  OperatorRouteSummary,
  OperatorTripManifest,
  OperatorTripSummary,
  OperatorVehicleDetail,
  RouteId,
  RouteStopId,
  SaveFleetVehicleInput,
  SeatLayout,
  TicketId,
  TripId,
  UpdateCompanyProfileInput,
  VehicleId,
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

// ============================================================================
// Carrier profile (onboarding / settings)
// ============================================================================

export async function getOperatorCompanyProfile(companyId: CompanyId): Promise<OperatorCompanyProfile> {
  const c = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  return {
    id: c.id as never,
    name: c.name,
    slug: c.slug,
    legalName: c.legalName,
    fiscalCode: c.fiscalCode,
    supportPhone: c.supportPhone,
    supportEmail: c.supportEmail,
    logoUrl: c.logoUrl,
    brandPrimaryColor: c.brandPrimaryColor as never,
    brandSecondaryColor: c.brandSecondaryColor as never,
    emergencyContacts: (c.emergencyContacts as unknown as EmergencyContact[]) ?? [],
    status: c.status,
    isVerified: c.isVerified,
  };
}

export async function updateOperatorCompanyProfile(
  companyId: CompanyId,
  input: UpdateCompanyProfileInput
): Promise<OperatorCompanyProfile> {
  await prisma.company.update({
    where: { id: companyId },
    data: {
      legalName: input.legalName,
      fiscalCode: input.fiscalCode,
      supportPhone: input.supportPhone,
      supportEmail: input.supportEmail,
      logoUrl: input.logoUrl,
      brandPrimaryColor: input.brandPrimaryColor,
      brandSecondaryColor: input.brandSecondaryColor,
      emergencyContacts: input.emergencyContacts as never,
    },
  });
  return getOperatorCompanyProfile(companyId);
}

// ============================================================================
// Fleet builder
// ============================================================================

export class VehicleHasBookingHistoryError extends Error {
  constructor(message = "This vehicle has ticket history — its layout can no longer be edited") {
    super(message);
    this.name = "VehicleHasBookingHistoryError";
  }
}

export class DuplicateRegistrationPlateError extends Error {
  constructor(message = "Another vehicle already uses this registration plate") {
    super(message);
    this.name = "DuplicateRegistrationPlateError";
  }
}

export class EmptyVehicleLayoutError extends Error {
  constructor(message = "A vehicle needs at least one bookable seat") {
    super(message);
    this.name = "EmptyVehicleLayoutError";
  }
}

export async function listOperatorFleet(companyId: CompanyId): Promise<OperatorFleetVehicleSummary[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId },
    orderBy: { registrationPlate: "asc" },
    include: { _count: { select: { trips: { where: { departureAt: { gte: new Date() } } } } } },
  });
  return vehicles.map((v) => ({
    id: v.id as never,
    registrationPlate: v.registrationPlate,
    vehicleType: v.vehicleType,
    totalSeats: v.totalSeats,
    isActive: v.isActive,
    upcomingTripCount: v._count.trips,
  }));
}

export async function getOperatorVehicleDetail(companyId: CompanyId, vehicleId: VehicleId): Promise<OperatorVehicleDetail> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, include: { seats: true } });
  if (!vehicle || vehicle.companyId !== companyId) {
    throw new OperatorNotFoundError("Vehicle not found for this company");
  }
  return {
    id: vehicle.id as never,
    registrationPlate: vehicle.registrationPlate,
    vehicleType: vehicle.vehicleType,
    seatLayout: vehicle.seatLayout as unknown as SeatLayout,
    seats: vehicle.seats
      .sort((a, b) => a.rowNumber - b.rowNumber || a.colPosition - b.colPosition)
      .map((s) => ({ seatNumber: s.seatNumber, rowNumber: s.rowNumber, colPosition: s.colPosition, deck: s.deck, seatType: s.seatType })),
  };
}

/**
 * Creating a vehicle: straightforward insert. Editing an existing one:
 * whole-layout replace (delete every seat, reinsert from the builder's
 * current grid state) — simple and correct as long as nothing references
 * those seats yet. The moment a ticket exists against any of them, the
 * layout is frozen; re-architecting a bus mid-booking-history is a real
 * product decision (most carriers just retire the vehicle and add a new
 * one), not something this endpoint tries to paper over.
 */
export async function saveOperatorVehicle(companyId: CompanyId, input: SaveFleetVehicleInput): Promise<OperatorVehicleDetail> {
  if (input.seats.length === 0) {
    throw new EmptyVehicleLayoutError();
  }

  const plateOwner = await prisma.vehicle.findUnique({ where: { registrationPlate: input.registrationPlate } });
  if (plateOwner && plateOwner.id !== input.vehicleId) {
    throw new DuplicateRegistrationPlateError();
  }

  const totalSeats = input.seats.filter((s) => s.seatType !== "driver").length;

  if (input.vehicleId) {
    const existing = await prisma.vehicle.findUnique({ where: { id: input.vehicleId }, include: { seats: { include: { tickets: { take: 1 } } } } });
    if (!existing || existing.companyId !== companyId) {
      throw new OperatorNotFoundError("Vehicle not found for this company");
    }
    if (existing.seats.some((s) => s.tickets.length > 0)) {
      throw new VehicleHasBookingHistoryError();
    }

    await prisma.$transaction([
      prisma.seat.deleteMany({ where: { vehicleId: input.vehicleId } }),
      prisma.vehicle.update({
        where: { id: input.vehicleId },
        data: {
          registrationPlate: input.registrationPlate,
          vehicleType: input.vehicleType,
          totalSeats,
          seatLayout: input.seatLayout as never,
          seats: { create: input.seats.map((s) => ({ ...s, isBookable: s.seatType !== "driver" })) },
        },
      }),
    ]);
    return getOperatorVehicleDetail(companyId, input.vehicleId);
  }

  const created = await prisma.vehicle.create({
    data: {
      companyId,
      registrationPlate: input.registrationPlate,
      vehicleType: input.vehicleType,
      totalSeats,
      seatLayout: input.seatLayout as never,
      seats: { create: input.seats.map((s) => ({ ...s, isBookable: s.seatType !== "driver" })) },
    },
  });
  return getOperatorVehicleDetail(companyId, created.id as never);
}

// ============================================================================
// Trip control & passenger manifest
// ============================================================================

const MANIFEST_STATUSES = ["reserved", "paid", "checked_in", "boarded"] as const;

export async function getOperatorTripManifest(companyId: CompanyId, tripId: TripId): Promise<OperatorTripManifest> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      route: { include: { routeStops: { include: { stop: true }, orderBy: { orderIndex: "asc" } } } },
      vehicle: { select: { vehicleType: true, registrationPlate: true } },
      tickets: {
        where: { status: { in: [...MANIFEST_STATUSES] } },
        include: { seat: { select: { seatNumber: true } }, originStop: { include: { stop: true } }, destStop: { include: { stop: true } } },
        orderBy: { originOrderIndex: "asc" },
      },
    },
  });

  if (!trip || trip.companyId !== companyId) {
    throw new OperatorNotFoundError("Trip not found for this company");
  }

  const passengers: OperatorManifestEntry[] = trip.tickets.map((t) => ({
    ticketId: t.id as never,
    ticketNumber: t.ticketNumber,
    passengerName: t.passengerFullName,
    passengerPhone: t.passengerPhone,
    seatNumber: t.seat.seatNumber,
    originCity: t.originStop.stop.city,
    destinationCity: t.destStop.stop.city,
    fareClass: t.fareClass,
    priceAmount: Number(t.priceAmount),
    currency: t.currency,
    status: t.status,
  }));

  return {
    trip: {
      id: trip.id as never,
      routeName: trip.route.name,
      departureAt: trip.departureAt.toISOString(),
      status: trip.status,
      vehicleType: trip.vehicle.vehicleType,
      registrationPlate: trip.vehicle.registrationPlate,
    },
    boardingStops: trip.route.routeStops.map((rs) => ({ routeStopId: rs.id as never, city: rs.stop.city, orderIndex: rs.orderIndex })),
    passengers,
  };
}

export class InvalidCheckInTransitionError extends Error {
  constructor(message = "Ticket is not in a boardable state") {
    super(message);
    this.name = "InvalidCheckInTransitionError";
  }
}

/** Manual, operator-side check-in toggle — distinct from the conductor QR
 * scan path (verifyAndCheckInTicket in ticket.service.ts), which also
 * requires a valid HMAC signature. This one trusts the dashboard session
 * instead: a staff member ticking a name off a printed manifest. */
export async function setManifestCheckIn(
  companyId: CompanyId,
  tripId: TripId,
  ticketId: TicketId,
  checkedIn: boolean
): Promise<OperatorManifestEntry["status"]> {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.tripId !== tripId) {
    throw new OperatorNotFoundError("Ticket not found on this trip");
  }
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.companyId !== companyId) {
    throw new OperatorNotFoundError("Trip not found for this company");
  }

  if (checkedIn) {
    if (!["paid", "reserved"].includes(ticket.status)) {
      throw new InvalidCheckInTransitionError();
    }
    const updated = await prisma.ticket.update({ where: { id: ticketId }, data: { status: "checked_in", checkedInAt: new Date() } });
    return updated.status;
  }

  if (ticket.status !== "checked_in") {
    throw new InvalidCheckInTransitionError("Only a checked-in ticket can be un-checked");
  }
  const updated = await prisma.ticket.update({ where: { id: ticketId }, data: { status: "paid", checkedInAt: null } });
  return updated.status;
}
