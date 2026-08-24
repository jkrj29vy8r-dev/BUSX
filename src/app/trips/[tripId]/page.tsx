"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ShieldCheck, TimerReset } from "lucide-react";
import { Nav } from "@/components/nav";
import { MetroTimeline } from "@/components/metro-timeline";
import { MapPinPreview } from "@/components/map-pin-preview";
import { SeatPicker } from "@/components/seat-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTripDetail } from "@/hooks/use-trip-detail";
import { useSeatMap } from "@/hooks/use-seat-map";
import { useCreateSeatLock, useReleaseSeatLock } from "@/hooks/use-seat-lock";
import { useCountdown, formatCountdown } from "@/hooks/use-countdown";
import { useBookingStore } from "@/store/booking-store";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-labels";
import type { RouteStopId, SeatAvailability, TripId } from "@/types/database";

export default function TripSeatSelectionPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TripSeatSelectionContent />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="h-96 animate-pulse rounded-lg border border-border bg-white" />
      </main>
    </div>
  );
}

function TripSeatSelectionContent() {
  const routeParams = useParams<{ tripId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tripId = routeParams.tripId as TripId;
  const originRouteStopId = searchParams.get("originRouteStopId") as RouteStopId | null;
  const destinationRouteStopId = searchParams.get("destinationRouteStopId") as RouteStopId | null;
  const passengers = Number(searchParams.get("passengers") ?? "1");
  const fallbackPrice = Number(searchParams.get("price") ?? "0");
  const currency = searchParams.get("currency") ?? "RON";
  const originLabel = searchParams.get("originLabel") ?? "";
  const destinationLabel = searchParams.get("destinationLabel") ?? "";

  const { data: tripDetail, isLoading: tripLoading } = useTripDetail(tripId);
  const { data: seatMap, isLoading: seatsLoading } = useSeatMap(tripId, originRouteStopId, destinationRouteStopId);

  const startSegmentSelection = useBookingStore((s) => s.startSegmentSelection);
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const clearExpiredSeats = useBookingStore((s) => s.clearExpiredSeats);

  const createLock = useCreateSeatLock();
  const releaseLock = useReleaseSeatLock();

  useEffect(() => {
    if (tripDetail && originRouteStopId && destinationRouteStopId) {
      startSegmentSelection({
        tripId,
        routeId: tripDetail.route.id,
        originRouteStopId,
        destinationRouteStopId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, originRouteStopId, destinationRouteStopId, tripDetail?.route.id]);

  useEffect(() => {
    const interval = setInterval(clearExpiredSeats, 1000);
    return () => clearInterval(interval);
  }, [clearExpiredSeats]);

  const earliestExpiry = selectedSeats.reduce<string | null>(
    (min, s) => (min === null || s.lockExpiresAt < min ? s.lockExpiresAt : min),
    null
  );
  const secondsLeft = useCountdown(earliestExpiry);

  const standardPrice = seatMap?.standardPrice?.amount ?? fallbackPrice;
  const premiumPrice = seatMap?.premiumPrice?.amount ?? null;

  function handleToggleSeat(seat: SeatAvailability) {
    if (!originRouteStopId || !destinationRouteStopId) return;
    const existing = selectedSeats.find((s) => s.seatId === seat.seatId);

    if (existing) {
      releaseLock.mutate({ lockId: existing.seatLockId, seatId: seat.seatId, tripId });
      return;
    }
    if (selectedSeats.length >= passengers) return;

    const isVip = seat.seatType === "premium";
    const fareClass = isVip && premiumPrice != null ? "premium" : "standard";
    const priceAmount = fareClass === "premium" ? (premiumPrice as number) : standardPrice;

    createLock.mutate({
      tripId,
      seatId: seat.seatId,
      originRouteStopId,
      destinationRouteStopId,
      seatNumber: seat.seatNumber,
      fareClass,
      priceAmount,
    });
  }

  const isLoading = tripLoading || seatsLoading;
  const readyToCheckout = selectedSeats.length === passengers && passengers > 0;
  const total = selectedSeats.reduce((sum, s) => sum + s.priceAmount, 0);

  return (
    <div className="min-h-screen pb-32">
      <Nav />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {isLoading && <div className="h-96 animate-pulse rounded-lg border border-border bg-white" />}

        {!isLoading && tripDetail && seatMap && originRouteStopId && destinationRouteStopId && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
            <aside className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-white p-5 shadow-subtle">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="flex size-7 items-center justify-center rounded text-xs font-bold text-white"
                    style={{ backgroundColor: tripDetail.company.brand_primary_color }}
                  >
                    {tripDetail.company.name.slice(0, 1)}
                  </span>
                  <span className="text-sm font-semibold text-ink">{tripDetail.company.name}</span>
                  {tripDetail.company.is_verified && <ShieldCheck className="size-3.5 text-electric" strokeWidth={2.25} />}
                </div>
                <Badge variant="neutral" className="mb-4">
                  {VEHICLE_TYPE_LABELS[tripDetail.vehicle.vehicle_type]}
                </Badge>

                <MapPinPreview
                  className="mb-4 h-28 w-full"
                  stops={tripDetail.stops.map((s) => ({ name: s.city, latitude: s.latitude, longitude: s.longitude }))}
                  highlightIndex={tripDetail.stops.findIndex((s) => s.routeStopId === destinationRouteStopId)}
                />

                <MetroTimeline
                  stops={tripDetail.stops.map((s) => ({
                    routeStopId: s.routeStopId,
                    name: s.name,
                    city: s.city,
                    orderIndex: s.orderIndex,
                    scheduledTime: s.scheduledDeparture,
                  }))}
                  originOrderIndex={tripDetail.stops.find((s) => s.routeStopId === originRouteStopId)?.orderIndex ?? 0}
                  destinationOrderIndex={tripDetail.stops.find((s) => s.routeStopId === destinationRouteStopId)?.orderIndex ?? 0}
                />
              </div>
            </aside>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-ink">
                  Choose {passengers > 1 ? `${passengers} seats` : "a seat"}
                  {originLabel && destinationLabel ? ` · ${originLabel} → ${destinationLabel}` : ""}
                </h1>
                {secondsLeft !== null && (
                  <Badge variant={secondsLeft < 60 ? "danger" : "warning"}>
                    <TimerReset className="size-3" strokeWidth={2.25} />
                    {formatCountdown(secondsLeft)} left to check out
                  </Badge>
                )}
              </div>

              <SeatPicker
                layout={seatMap.vehicleLayout}
                seats={seatMap.seats}
                selectedSeatIds={new Set(selectedSeats.map((s) => s.seatId))}
                pendingSeatIds={new Set(createLock.isPending && createLock.variables ? [createLock.variables.seatId] : [])}
                onToggleSeat={handleToggleSeat}
                maxSelectable={passengers}
                standardPriceAmount={standardPrice}
                premiumPriceAmount={premiumPrice}
                currency={currency}
              />

              {createLock.isError && (
                <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/[0.06] px-3 py-2 text-sm text-danger">
                  <AlertTriangle className="size-4 shrink-0" strokeWidth={1.75} />
                  That seat was just taken for this segment — pick another.
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {selectedSeats.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div>
              <div className="text-sm text-ink-secondary">
                {selectedSeats.length} / {passengers} {passengers === 1 ? "seat" : "seats"} selected · seat
                {selectedSeats.length === 1 ? "" : "s"} {selectedSeats.map((s) => s.seatNumber).join(", ")}
              </div>
              <div className="text-xl font-extrabold tabular-nums text-ink">
                {total.toFixed(0)} <span className="text-sm font-normal text-ink-tertiary">{currency}</span>
              </div>
            </div>
            <Button variant="electric" size="lg" disabled={!readyToCheckout} onClick={() => router.push("/checkout")}>
              Continue to checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
