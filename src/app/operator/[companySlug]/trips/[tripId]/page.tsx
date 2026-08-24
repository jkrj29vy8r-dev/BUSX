"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, MapPin, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOperatorTripManifest, useSetManifestCheckIn } from "@/hooks/use-operator";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-labels";
import { formatClockTime, formatWeekdayDate } from "@/lib/format-date";
import { cn } from "@/lib/cn";
import type { RouteStopId } from "@/types/database";

const BOARDABLE = new Set(["checked_in", "boarded"]);

export default function OperatorTripManifestPage() {
  const { companySlug, tripId } = useParams<{ companySlug: string; tripId: string }>();
  const { data, isLoading } = useOperatorTripManifest(companySlug, tripId as never);
  const checkIn = useSetManifestCheckIn(companySlug, tripId as never);
  const [stationFilter, setStationFilter] = useState<RouteStopId | "all">("all");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (stationFilter === "all") return data.passengers;
    const stop = data.boardingStops.find((s) => s.routeStopId === stationFilter);
    if (!stop) return data.passengers;
    return data.passengers.filter((p) => p.originCity === stop.city);
  }, [data, stationFilter]);

  const boardedCount = data?.passengers.filter((p) => BOARDABLE.has(p.status)).length ?? 0;

  return (
    <main className="flex-1 px-8 py-8">
      <Link
        href={`/operator/${companySlug}/trips`}
        className="mb-4 flex w-fit items-center gap-1 text-xs font-semibold text-ink-onDarkSecondary transition-colors hover:text-white"
      >
        <ChevronLeft className="size-3.5" strokeWidth={2.25} />
        All trips
      </Link>

      {isLoading && <div className="h-96 animate-pulse border border-border-dark bg-surface-dark" />}

      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">{data.trip.routeName}</h1>
              <div className="mt-1 flex items-center gap-3 text-[13px] text-ink-onDarkSecondary">
                <span className="font-mono">{formatClockTime(new Date(data.trip.departureAt))}</span>
                <span>{formatWeekdayDate(new Date(data.trip.departureAt))}</span>
                <Badge variant="on-dark">{VEHICLE_TYPE_LABELS[data.trip.vehicleType]}</Badge>
                <span className="font-mono">{data.trip.registrationPlate}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-white">
                {boardedCount}
                <span className="text-sm font-normal text-ink-onDarkSecondary">/{data.passengers.length}</span>
              </div>
              <div className="text-[11px] text-ink-onDarkSecondary">checked in</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <FilterChip active={stationFilter === "all"} onClick={() => setStationFilter("all")}>
              All boarding stations
            </FilterChip>
            {data.boardingStops.map((stop) => (
              <FilterChip key={stop.routeStopId} active={stationFilter === stop.routeStopId} onClick={() => setStationFilter(stop.routeStopId)}>
                <MapPin className="size-3" strokeWidth={2} />
                {stop.city}
              </FilterChip>
            ))}
          </div>

          <div className="mt-4 overflow-hidden border border-border-dark">
            {filtered.length === 0 && <div className="p-10 text-center text-sm text-ink-onDarkSecondary">No passengers match this filter.</div>}
            {filtered.map((passenger, i) => {
              const isCheckedIn = BOARDABLE.has(passenger.status);
              const isTogglable = ["paid", "reserved", "checked_in"].includes(passenger.status);
              const isSaving = checkIn.isPending && checkIn.variables?.ticketId === passenger.ticketId;
              return (
                <div
                  key={passenger.ticketId}
                  className={cn("flex items-center justify-between px-5 py-3", i > 0 && "border-t border-border-dark")}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center border border-border-dark font-mono text-xs font-bold text-white">
                      {passenger.seatNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                        <UserRound className="size-3.5 text-ink-onDarkSecondary" strokeWidth={1.75} />
                        {passenger.passengerName}
                        {passenger.fareClass === "premium" && <Sparkles className="size-3 text-gold" strokeWidth={2.5} fill="currentColor" />}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-ink-onDarkSecondary">
                        <span>
                          {passenger.originCity} → {passenger.destinationCity}
                        </span>
                        {passenger.passengerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-2.5" strokeWidth={2} />
                            {passenger.passengerPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink-onDarkSecondary">
                      {passenger.priceAmount.toFixed(0)} {passenger.currency}
                    </span>
                    <button
                      type="button"
                      disabled={!isTogglable || isSaving}
                      onClick={() => checkIn.mutate({ ticketId: passenger.ticketId, checkedIn: !isCheckedIn })}
                      className={cn(
                        "flex h-8 min-w-24 items-center justify-center gap-1.5 border px-3 text-[11px] font-bold uppercase tracking-wide transition-colors disabled:opacity-40",
                        isCheckedIn ? "border-emerald bg-emerald/10 text-emerald" : "border-border-dark text-ink-onDarkSecondary hover:border-white/30 hover:text-white"
                      )}
                    >
                      {isSaving ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : isCheckedIn ? (
                        <>
                          <ShieldCheck className="size-3" strokeWidth={2.5} />
                          Boarded
                        </>
                      ) : (
                        "Check in"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "border-electric bg-electric/10 text-[#6FA6FF]" : "border-border-dark text-ink-onDarkSecondary hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
