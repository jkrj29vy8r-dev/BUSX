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

const TRIP_STATUS_LABELS: Record<string, string> = {
  scheduled: "programată",
  boarding: "îmbarcare",
  delayed: "întârziată",
  departed: "plecată",
  in_transit: "în cursă",
  completed: "finalizată",
  cancelled: "anulată",
};

const COMPANY_STATUS_LABELS: Record<string, string> = {
  pending: "în așteptare",
  active: "activ",
  suspended: "suspendat",
  terminated: "încheiat",
};

export default function OperatorOverviewPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { data, isLoading } = useOperatorOverview(companySlug);

  return (
    <main className="flex-1 px-8 py-8">
      <h1 className="text-lg font-bold tracking-tight text-white">Prezentare generală</h1>
      <p className="mt-1 text-[13px] text-ink-onDarkSecondary">Ziua de azi, pe scurt, în timp real.</p>

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
            <StatTile className="border-0" label="Curse azi" value={String(data.tripsToday)} icon={CalendarClock} />
            <StatTile className="border-0" label="Locuri vândute azi" value={String(data.seatsSoldToday)} icon={Ticket} tone="electric" />
            <StatTile
              className="border-0"
              label="Venit azi"
              value={`${data.revenueToday.toFixed(0)} ${data.currency}`}
              icon={Wallet}
              tone="emerald"
            />
            <StatTile className="border-0" label="Rezervări active acum" value={String(data.liveSeatLocks)} icon={Radio} tone="emerald" live />
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">Următoarele plecări</h2>
              <Link href={`/operator/${companySlug}/trips`} className="text-xs font-semibold text-[#6FA6FF] hover:text-white">
                Vezi toate cursele
              </Link>
            </div>

            <div className="border border-border-dark">
              {data.upcomingDepartures.length === 0 && (
                <div className="p-8 text-center text-sm text-ink-onDarkSecondary">Nicio plecare programată.</div>
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
                      <span className="font-mono font-semibold text-white">{trip.seatsSold}</span> / {trip.totalSeats} locuri
                    </div>
                    <Badge variant={TRIP_STATUS_BADGE[trip.status] ?? "on-dark"}>{TRIP_STATUS_LABELS[trip.status] ?? trip.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.company.status !== "active" && (
            <div className="mt-6 flex items-center gap-2 border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
              <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} />
              Statusul contului este „{COMPANY_STATUS_LABELS[data.company.status] ?? data.company.status}” — cursele tale nu vor apărea în căutările pasagerilor până nu devine activ.
            </div>
          )}
          {data.company.status === "active" && !data.company.isVerified && (
            <div className="mt-6 flex items-center gap-2 border border-warning/30 bg-warning/[0.06] px-4 py-3 text-sm text-warning">
              <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} />
              Operatorul tău nu este încă verificat — cursele pot fi căutate, dar pasagerii nu vor vedea insigna de verificare până la finalizare.
            </div>
          )}
        </>
      )}
    </main>
  );
}
