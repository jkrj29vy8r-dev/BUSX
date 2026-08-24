"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CalendarClock, Radio, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { StatTile } from "@/components/operator/stat-tile";
import { Badge } from "@/components/ui/badge";
import { useOperatorOverview } from "@/hooks/use-operator";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-labels";
import { formatClockTime, formatRelativeDay } from "@/lib/format-date";

const TRIP_STATUS_BADGE: Record<string, "on-dark" | "electric" | "emerald" | "warning" | "danger"> = {
  scheduled: "on-dark",
  boarding: "electric",
  delayed: "warning",
  departed: "emerald",
  in_transit: "emerald",
  completed: "on-dark",
  cancelled: "danger",
};

export default function OperatorOverviewPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { data, isLoading } = useOperatorOverview(companySlug);

  return (
    <main className="flex-1 px-8 py-8">
      <h1 className="text-lg font-bold tracking-tight text-white">Overview</h1>
      <p className="mt-1 text-[13px] text-ink-onDarkSecondary">Today at a glance, live.</p>

      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-px border border-border-dark bg-border-dark sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse bg-surface-dark" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-px border border-border-dark bg-border-dark sm:grid-cols-2 lg:grid-cols-4">
            <StatTile className="border-0" label="Trips departing today" value={String(data.tripsToday)} icon={CalendarClock} />
            <StatTile className="border-0" label="Seats sold today" value={String(data.seatsSoldToday)} icon={Ticket} tone="electric" />
            <StatTile
              className="border-0"
              label="Revenue today"
              value={`${data.revenueToday.toFixed(0)} ${data.currency}`}
              icon={Wallet}
              tone="emerald"
            />
            <StatTile className="border-0" label="Active seat holds right now" value={String(data.liveSeatLocks)} icon={Radio} tone="emerald" live />
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">Next departures</h2>
              <Link href={`/operator/${companySlug}/trips`} className="text-xs font-semibold text-[#6FA6FF] hover:text-white">
                View all trips
              </Link>
            </div>

            <div className="border border-border-dark">
              {data.upcomingDepartures.length === 0 && (
                <div className="p-8 text-center text-sm text-ink-onDarkSecondary">No upcoming departures scheduled.</div>
              )}
              {data.upcomingDepartures.map((trip, i) => (
                <div
                  key={trip.tripId}
                  className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-border-dark" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 shrink-0">
                      <div className="font-mono text-sm font-bold tabular-nums text-white">
                        {formatClockTime(new Date(trip.departureAt))}
                      </div>
                      <div className="text-[11px] text-ink-onDarkSecondary">{formatRelativeDay(new Date(trip.departureAt))}</div>
                    </div>
                    <div className="text-sm font-medium text-white">{trip.routeName}</div>
                    <Badge variant="on-dark">{VEHICLE_TYPE_LABELS[trip.vehicleType]}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-ink-onDarkSecondary">
                      <span className="font-mono font-semibold text-white">{trip.seatsSold}</span> / {trip.totalSeats} seats
                    </div>
                    <Badge variant={TRIP_STATUS_BADGE[trip.status] ?? "on-dark"}>{trip.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.company.status !== "active" && (
            <div className="mt-6 flex items-center gap-2 border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
              <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} />
              Account status is &ldquo;{data.company.status}&rdquo; — your trips won&apos;t appear in passenger search until it&apos;s active.
            </div>
          )}
          {data.company.status === "active" && !data.company.isVerified && (
            <div className="mt-6 flex items-center gap-2 border border-warning/30 bg-warning/[0.06] px-4 py-3 text-sm text-warning">
              <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} />
              Your carrier isn&apos;t verified yet — trips are searchable, but passengers won&apos;t see the verified badge until it completes.
            </div>
          )}
        </>
      )}
    </main>
  );
}
