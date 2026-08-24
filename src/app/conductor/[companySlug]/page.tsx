"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOperatorTrips } from "@/hooks/use-operator";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-labels";
import { formatClockTime, formatRelativeDay } from "@/lib/format-date";

const BOARDING_WINDOW_MS = { before: 3 * 60 * 60_000, after: 24 * 60 * 60_000 };

export default function ConductorTripPickerPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { data: trips, isLoading } = useOperatorTrips(companySlug);

  const boardable = useMemo(() => {
    if (!trips) return [];
    const now = Date.now();
    return trips
      .filter((t) => {
        const dep = new Date(t.departureAt).getTime();
        return dep >= now - BOARDING_WINDOW_MS.before && dep <= now + BOARDING_WINDOW_MS.after && t.status !== "cancelled";
      })
      .sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
  }, [trips]);

  return (
    <div className="min-h-screen bg-surface-dark px-6 py-8 text-ink-onDark">
      <div className="mx-auto max-w-sm">
        <h1 className="text-lg font-bold text-white">Pick a trip to board</h1>
        <p className="mt-1 text-[13px] text-ink-onDarkSecondary">Departures within the next day.</p>

        {isLoading && <div className="mt-6 h-48 animate-pulse border border-border-dark" />}

        {!isLoading && boardable.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-3 border border-border-dark py-16 text-center">
            <CalendarClock className="size-8 text-ink-onDarkSecondary" strokeWidth={1.25} />
            <div className="text-sm text-ink-onDarkSecondary">No boardable trips right now</div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-px">
          {boardable.map((trip) => (
            <Link
              key={trip.id}
              href={`/conductor/${companySlug}/trips/${trip.id}/scan`}
              className="flex items-center justify-between border border-border-dark p-4 transition-colors hover:bg-white/[0.04]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">{formatClockTime(new Date(trip.departureAt))}</span>
                  <span className="text-[11px] text-ink-onDarkSecondary">{formatRelativeDay(new Date(trip.departureAt))}</span>
                </div>
                <div className="mt-0.5 text-sm text-white">{trip.routeName}</div>
                <Badge variant="on-dark" className="mt-1.5">
                  {VEHICLE_TYPE_LABELS[trip.vehicleType]}
                </Badge>
              </div>
              <ChevronRight className="size-5 text-ink-onDarkSecondary" strokeWidth={1.75} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
