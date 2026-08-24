import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signTicketPayload, verifyTicketQrOnServer } from "@/lib/crypto/ticket-hmac";
import { getSegmentPrice } from "@/lib/services/pricing.service";
import type {
  BookingId,
  CreateBookingInput,
  CreateBookingResult,
  IssuedTicket,
  TicketId,
  TicketRow,
  TicketVerificationResult,
} from "@/types/database";

const EXCLUSION_VIOLATION = "23P01";

export class SeatLockExpiredError extends Error {
  constructor(message = "One or more seat locks have expired or were released") {
    super(message);
    this.name = "SeatLockExpiredError";
  }
}

export class SegmentAlreadyTicketedError extends Error {
  constructor(message = "This seat's segment was booked by someone else before checkout completed") {
    super(message);
    this.name = "SegmentAlreadyTicketedError";
  }
}

function nextTicketNumber(): string {
  const year = new Date().getFullYear();
  return `BUSX-${year}-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function nextBookingNumber(): string {
  return `BK-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

/**
 * Converts a set of active seat_locks into paid tickets inside a single
 * transaction. Order of operations matters:
 *
 *   1. Re-validate every lock is still 'active' and unexpired (a lock can
 *      lapse between "payment authorized" and "we get around to writing
 *      tickets" under load).
 *   2. Price each segment via the matrix (never trust a client-submitted
 *      price).
 *   3. Insert the ticket row — protected by the SAME kind of GiST EXCLUDE
 *      constraint as seat_locks, so even if step 1's check raced against
 *      another writer, the database itself refuses an overlapping ticket.
 *   4. Flip the consumed locks to 'converted'.
 *
 * If the exclusion constraint fires here despite step 1 passing, it means
 * another transaction committed a conflicting ticket in the gap — we
 * surface that as SegmentAlreadyTicketedError and the caller should refund/
 * fail that single ticket rather than the whole booking.
 */
export async function issueTicketsForBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        bookingNumber: nextBookingNumber(),
        userId: input.userId,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        paymentProvider: input.paymentProvider,
        paymentStatus: "paid",
        totalAmount: 0,
        currency: "RON",
      },
    });

    const tickets: IssuedTicket[] = [];
    let totalAmount = 0;
    let currency = "RON";

    for (const passenger of input.passengers) {
      const lock = await tx.seatLock.findUnique({ where: { id: passenger.seatLockId } });
      if (!lock || lock.status !== "active" || lock.expiresAt <= new Date() || lock.sessionId !== input.sessionId) {
        throw new SeatLockExpiredError(`Seat lock ${passenger.seatLockId} is no longer valid`);
      }

      const trip = await tx.trip.findUniqueOrThrow({ where: { id: lock.tripId } });
      const quote = await getSegmentPrice({
        routeId: trip.routeId as never,
        originRouteStopId: lock.originRouteStopId as never,
        destinationRouteStopId: lock.destinationRouteStopId as never,
        fareClass: passenger.fareClass,
      });

      const seat = await tx.seat.findUniqueOrThrow({ where: { id: lock.seatId } });
      const ticketId = randomUUID() as TicketId;
      const ticketNumber = nextTicketNumber();
      const issuedAt = new Date();

      const signed = signTicketPayload({
        v: 1,
        ticketNumber,
        ticketId,
        tripId: lock.tripId as never,
        seatId: lock.seatId as never,
        seatNumber: seat.seatNumber,
        originRouteStopId: lock.originRouteStopId as never,
        destinationRouteStopId: lock.destinationRouteStopId as never,
        fareClass: passenger.fareClass,
        issuedAt: issuedAt.toISOString(),
      });

      let created;
      try {
        created = await tx.ticket.create({
          data: {
            id: ticketId,
            ticketNumber,
            bookingId: booking.id,
            tripId: lock.tripId,
            seatId: lock.seatId,
            originRouteStopId: lock.originRouteStopId,
            destinationRouteStopId: lock.destinationRouteStopId,
            originOrderIndex: lock.originOrderIndex,
            destinationOrderIndex: lock.destinationOrderIndex,
            passengerId: input.userId,
            passengerFullName: passenger.fullName,
            passengerPhone: passenger.phone,
            passengerEmail: passenger.email,
            fareClass: passenger.fareClass,
            priceAmount: quote.amount,
            currency: quote.currency,
            status: "paid",
            qrPayload: signed.payloadJson,
            hmacSignature: signed.signature,
            signatureKeyVersion: signed.payload.keyVersion,
            issuedAt,
          },
        });
      } catch (err) {
        if (isExclusionViolation(err)) {
          throw new SegmentAlreadyTicketedError(`Seat ${seat.seatNumber} segment was just taken by another booking`);
        }
        throw err;
      }

      await tx.seatLock.update({ where: { id: lock.id }, data: { status: "converted" } });

      totalAmount += quote.amount;
      currency = quote.currency;
      tickets.push({ ...toTicketRow(created), seat_number: seat.seatNumber });
    }

    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { totalAmount, currency },
    });

    return {
      booking: {
        id: updatedBooking.id as BookingId,
        booking_number: updatedBooking.bookingNumber,
        user_id: updatedBooking.userId as never,
        contact_email: updatedBooking.contactEmail,
        contact_phone: updatedBooking.contactPhone,
        total_amount: totalAmount,
        currency,
        payment_status: updatedBooking.paymentStatus,
        payment_provider: updatedBooking.paymentProvider,
        payment_reference: updatedBooking.paymentReference,
        created_at: updatedBooking.createdAt.toISOString(),
        updated_at: updatedBooking.updatedAt.toISOString(),
      },
      tickets,
    };
  });
}

/** Online verification path: recomputes HMAC AND checks live check-in state.
 * Used by `/api/tickets/[ticketId]/verify` when the conductor device has
 * connectivity; falls back to `verifyTicketQrOnServer` / on-device
 * verification (same algorithm) when offline. */
export async function verifyAndCheckInTicket(qrString: string): Promise<
  TicketVerificationResult & { alreadyCheckedIn?: boolean }
> {
  const verification = verifyTicketQrOnServer(qrString);
  if (!verification.valid) return verification;

  const ticket = await prisma.ticket.findUnique({ where: { id: verification.payload.ticketId } });
  if (!ticket || ticket.hmacSignature !== qrString.split(".").pop()) {
    return { valid: false, reason: "bad_signature" };
  }

  if (ticket.status === "checked_in" || ticket.status === "boarded") {
    return { valid: true, payload: verification.payload, alreadyCheckedIn: true };
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "checked_in", checkedInAt: new Date() },
  });

  return { valid: true, payload: verification.payload, alreadyCheckedIn: false };
}

function isExclusionViolation(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const sqlState = (err.meta as { code?: string } | undefined)?.code;
    if (sqlState === EXCLUSION_VIOLATION) return true;
  }
  return err instanceof Error && err.message.includes(EXCLUSION_VIOLATION);
}

function toTicketRow(t: Awaited<ReturnType<typeof prisma.ticket.create>>): TicketRow {
  return {
    id: t.id as TicketId,
    ticket_number: t.ticketNumber,
    booking_id: t.bookingId as never,
    trip_id: t.tripId as never,
    seat_id: t.seatId as never,
    origin_route_stop_id: t.originRouteStopId as never,
    destination_route_stop_id: t.destinationRouteStopId as never,
    origin_order_index: t.originOrderIndex,
    destination_order_index: t.destinationOrderIndex,
    passenger_id: t.passengerId as never,
    passenger_full_name: t.passengerFullName,
    passenger_phone: t.passengerPhone,
    passenger_email: t.passengerEmail,
    fare_class: t.fareClass,
    price_amount: Number(t.priceAmount),
    currency: t.currency,
    status: t.status,
    qr_payload: t.qrPayload,
    hmac_signature: t.hmacSignature,
    signature_key_version: t.signatureKeyVersion,
    issued_at: t.issuedAt.toISOString(),
    checked_in_at: t.checkedInAt?.toISOString() ?? null,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  };
}
