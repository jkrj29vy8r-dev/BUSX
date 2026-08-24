"use client";

import { useParams, useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOperatorTrips } from "@/hooks/use-operator";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-labels";
import { formatClockTime, formatWeekdayDate } from "@/lib/format-date";

const TRIP_STATUS_BADGE: Record<string, "on-dark" | "electric" | "emerald" | "warning" | "danger"> = {
  scheduled: "on-dark",
  boarding: "electric",
  delayed: "warning",
  departed: "emerald",
  in_transit: "emerald",
  completed: "on-dark",
  cancelled: "danger",
};

export default function OperatorTripsPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const router = useRouter();
  const { data: trips, isLoading } = useOperatorTrips(companySlug);

  return (
    <main className="flex-1 px-8 py-8">
      <h1 className="text-lg font-bold tracking-tight text-white">Trips</h1>
      <p className="mt-1 text-[13px] text-ink-onDarkSecondary">Most recent 50, newest departure first. Click a run to open its manifest.</p>

      {isLoading && <div className="mt-6 h-64 animate-pulse border border-border-dark bg-surface-dark" />}

      {trips?.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 border border-border-dark py-16 text-center">
          <CalendarClock className="size-8 text-ink-onDarkSecondary" strokeWidth={1.25} />
          <div className="text-md font-medium text-white">No trips scheduled</div>
        </div>
      )}

      {trips && trips.length > 0 && (
        <div className="mt-6 overflow-hidden border border-border-dark">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-dark bg-surface-dark-raised text-left text-[10px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">
                <th className="px-4 py-2.5">Departure</th>
                <th className="px-4 py-2.5">Route</th>
                <th className="px-4 py-2.5">Vehicle</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Seats sold</th>
                <th className="px-4 py-2.5 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip, i) => {
                const departure = new Date(trip.departureAt);
                const fillRate = trip.totalSeats > 0 ? trip.seatsSold / trip.totalSeats : 0;
                return (
                  <tr
                    key={trip.id}
                    onClick={() => router.push(`/operator/${companySlug}/trips/${trip.id}`)}
                    className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${i > 0 ? "border-t border-border-dark" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm font-semibold tabular-nums text-white">{formatClockTime(departure)}</div>
                      <div className="text-xs text-ink-onDarkSecondary">{formatWeekdayDate(departure)}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{trip.routeName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="on-dark">{VEHICLE_TYPE_LABELS[trip.vehicleType]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={TRIP_STATUS_BADGE[trip.status] ?? "on-dark"}>{trip.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono tabular-nums text-white">
                        {trip.seatsSold}/{trip.totalSeats}
                      </span>
                      <div className="ml-auto mt-1 h-1 w-14 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full bg-electric" style={{ width: `${fillRate * 100}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                      {trip.revenue.toFixed(0)} {trip.currency}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
