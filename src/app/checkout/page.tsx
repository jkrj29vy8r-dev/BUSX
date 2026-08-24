"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, User } from "lucide-react";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TicketPass } from "@/components/ticket-pass";
import { useBookingStore } from "@/store/booking-store";
import { useCreateBooking } from "@/hooks/use-create-booking";
import { useTripDetail } from "@/hooks/use-trip-detail";
import type { CreateBookingResult, FareClass, RouteStopId, TripId } from "@/types/database";

interface PassengerFormRow {
  seatLockId: string;
  seatNumber: string;
  fullName: string;
  fareClass: FareClass;
  priceAmount: number;
}

interface ConfirmedContext {
  tripId: TripId;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
}

export default function CheckoutPage() {
  const router = useRouter();
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const sessionId = useBookingStore((s) => s.sessionId);
  const storeTripId = useBookingStore((s) => s.tripId);
  const storeOrigin = useBookingStore((s) => s.originRouteStopId);
  const storeDestination = useBookingStore((s) => s.destinationRouteStopId);
  const reset = useBookingStore((s) => s.reset);

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [rows, setRows] = useState<PassengerFormRow[]>(
    selectedSeats.map((s) => ({
      seatLockId: s.seatLockId,
      seatNumber: s.seatNumber,
      fullName: "",
      fareClass: s.fareClass,
      priceAmount: s.priceAmount,
    }))
  );

  const createBooking = useCreateBooking();
  const [result, setResult] = useState<CreateBookingResult | null>(null);
  const [confirmedContext, setConfirmedContext] = useState<ConfirmedContext | null>(null);

  const { data: tripDetail } = useTripDetail(confirmedContext?.tripId ?? null);

  const total = rows.reduce((sum, r) => sum + r.priceAmount, 0);
  const canSubmit = contactEmail.trim().length > 3 && rows.every((r) => r.fullName.trim().length > 1);

  function updateName(seatLockId: string, fullName: string) {
    setRows((prev) => prev.map((r) => (r.seatLockId === seatLockId ? { ...r, fullName } : r)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeTripId || !storeOrigin || !storeDestination) return;

    createBooking.mutate(
      {
        contactEmail,
        contactPhone: contactPhone || undefined,
        sessionId,
        paymentProvider: "demo",
        passengers: rows.map((r) => ({
          seatLockId: r.seatLockId as never,
          fullName: r.fullName,
          fareClass: r.fareClass,
        })),
      },
      {
        onSuccess: (data) => {
          setResult(data);
          setConfirmedContext({ tripId: storeTripId, originRouteStopId: storeOrigin, destinationRouteStopId: storeDestination });
          reset();
        },
      }
    );
  }

  if (result) {
    const origin = tripDetail?.stops.find((s) => s.routeStopId === confirmedContext?.originRouteStopId);
    const destination = tripDetail?.stops.find((s) => s.routeStopId === confirmedContext?.destinationRouteStopId);

    return (
      <div className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-muted text-emerald-hover">
            <CheckCircle2 className="size-7" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-extrabold text-ink">Booking confirmed</h1>
          <p className="mt-1 font-mono text-sm text-ink-secondary">{result.booking.booking_number}</p>

          <div className="mt-8 flex flex-col items-center gap-6">
            {result.tickets.map((t) =>
              tripDetail && origin && destination ? (
                <TicketPass
                  key={t.id}
                  ticket={t}
                  companyName={tripDetail.company.name}
                  companyColor={tripDetail.company.brand_primary_color}
                  routeName={tripDetail.route.name}
                  originCity={origin.city}
                  destinationCity={destination.city}
                  departureAtISO={tripDetail.trip.departure_at}
                  tripStatus={tripDetail.trip.status}
                  stopsForMap={tripDetail.stops.map((s) => ({ name: s.city, latitude: s.latitude, longitude: s.longitude }))}
                />
              ) : (
                <div key={t.id} className="h-96 w-full max-w-sm animate-pulse rounded-xl bg-ink/[0.06]" />
              )
            )}
          </div>

          <Button variant="secondary" size="md" className="mt-10" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </main>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-lg px-6 py-16 text-center">
          <p className="text-sm text-ink-secondary">No seats selected yet.</p>
          <Button variant="secondary" size="md" className="mt-4" onClick={() => router.push("/")}>
            Start a search
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-lg px-6 py-8">
        <h1 className="mb-6 text-lg font-bold text-ink">Passenger details</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.seatLockId} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-inset text-xs font-bold text-ink-secondary">
                  {row.seatNumber}
                </span>
                <Input
                  icon={<User className="size-4" strokeWidth={1.75} />}
                  placeholder="Full name, as on ID"
                  value={row.fullName}
                  onChange={(e) => updateName(row.seatLockId, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6">
            <Input type="email" placeholder="Contact email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
            <Input type="tel" placeholder="Contact phone (optional)" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>

          {createBooking.isError && (
            <div className="rounded-md border border-danger/30 bg-danger/[0.06] px-3 py-2 text-sm text-danger">
              {createBooking.error instanceof Error ? createBooking.error.message : "Checkout failed — please try again."}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-md text-ink-secondary">Total</div>
            <div className="text-xl font-extrabold tabular-nums text-ink">
              {total.toFixed(0)} <span className="text-sm font-normal text-ink-tertiary">RON</span>
            </div>
          </div>

          <Button type="submit" variant="electric" size="lg" disabled={!canSubmit || createBooking.isPending}>
            {createBooking.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm and pay
          </Button>
        </form>
      </main>
    </div>
  );
}
