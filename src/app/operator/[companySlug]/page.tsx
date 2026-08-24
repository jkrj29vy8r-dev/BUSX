"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CalendarClock, Radio, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { StatTile } from "@/components/operator/stat-tile";
import { Badge } from "@/components/ui/badge";
import { useOperatorOverview } from "@/hooks/use-operator";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-labels";
import { formatClockTime, formatRelativeDay } from "@/lib/format-date";

const TRIP_STATUS_BADGE: Record<string, "neutral" | "electric" | "emerald" | "warning" | "danger"> = {
  scheduled: "neutral",
  boarding: "electric",
  delayed: "warning",
  departed: "emerald",
  in_transit: "emerald",
  completed: "neutral",
  cancelled: "danger",
};

export default function OperatorOverviewPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { data, isLoading } = useOperatorOverview(companySlug);

  return (
    <main className="flex-1 px-8 py-8">
      <h1 className="text-xl font-extrabold tracking-tight text-ink">Overview</h1>
      <p className="mt-1 text-sm text-ink-secondary">Today at a glance, live.</p>

      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-white" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Trips departing today" value={String(data.tripsToday)} icon={CalendarClock} />
            <StatTile label="Seats sold today" value={String(data.seatsSoldToday)} icon={Ticket} tone="electric" />
            <StatTile
              label="Revenue today"
              value={`${data.revenueToday.toFixed(0)} ${data.currency}`}
              icon={Wallet}
              tone="emerald"
            />
            <StatTile label="Active seat holds right now" value={String(data.liveSeatLocks)} icon={Radio} tone="emerald" live />
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-tertiary">Next departures</h2>
              <Link href={`/operator/${companySlug}/trips`} className="text-xs font-semibold text-electric hover:text-electric-hover">
                View all trips
              </Link>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-subtle">
              {data.upcomingDepartures.length === 0 && (
                <div className="p-8 text-center text-sm text-ink-tertiary">No upcoming departures scheduled.</div>
              )}
              {data.upcomingDepartures.map((trip, i) => (
                <div
                  key={trip.tripId}
                  className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 shrink-0">
                      <div className="font-mono text-sm font-bold tabular-nums text-ink">
                        {formatClockTime(new Date(trip.departureAt))}
                      </div>
                      <div className="text-[11px] text-ink-tertiary">{formatRelativeDay(new Date(trip.departureAt))}</div>
                    </div>
                    <div className="text-sm font-medium text-ink">{trip.routeName}</div>
                    <Badge variant="neutral">{VEHICLE_TYPE_LABELS[trip.vehicleType]}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-ink-tertiary">
                      <span className="font-mono font-semibold text-ink">{trip.seatsSold}</span> / {trip.totalSeats} seats
                    </div>
                    <Badge variant={TRIP_STATUS_BADGE[trip.status] ?? "neutral"}>{trip.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.company.status !== "active" && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
              <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} />
              Account status is &ldquo;{data.company.status}&rdquo; — your trips won&apos;t appear in passenger search until it&apos;s active.
            </div>
          )}
          {data.company.status === "active" && !data.company.isVerified && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-4 py-3 text-sm text-warning">
              <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} />
              Your carrier isn&apos;t verified yet — trips are searchable, but passengers won&apos;t see the verified badge until it completes.
            </div>
          )}
        </>
      )}
    </main>
  );
}
