import { ChevronRight } from "lucide-react";
import type { OperatorRouteStop } from "@/types/database";

function formatOffset(minutes: number): string {
  if (minutes === 0) return "+0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `+${h}h${m > 0 ? ` ${m}m` : ""}` : `+${m}m`;
}

/** The route *template* — offsets from departure, not clock times (those
 * only exist once a route is attached to a specific trip). Distinct from
 * the passenger-facing MetroTimeline for exactly that reason. */
export function RouteStopsStrip({ stops }: { stops: OperatorRouteStop[] }) {
  const sorted = [...stops].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sorted.map((stop, i) => (
        <div key={stop.routeStopId} className="flex items-center gap-1.5">
          <div className="flex items-center gap-2 rounded-full border border-border-dark bg-white/[0.03] py-1 pl-1 pr-3">
            <span className="flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-surface-dark">
              {stop.orderIndex}
            </span>
            <span className="text-xs font-semibold text-white">{stop.city}</span>
            <span className="font-mono text-[10px] text-ink-onDarkSecondary">{formatOffset(stop.departureOffsetMinutes)}</span>
          </div>
          {i < sorted.length - 1 && <ChevronRight className="size-3.5 text-ink-onDarkSecondary" strokeWidth={2} />}
        </div>
      ))}
    </div>
  );
}
