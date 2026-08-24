import { cn } from "@/lib/cn";

export interface TimelineStop {
  routeStopId: string;
  name: string;
  city: string;
  orderIndex: number;
  scheduledTime: string; // ISO
}

interface RouteTimelineProps {
  stops: TimelineStop[];
  originOrderIndex: number;
  destinationOrderIndex: number;
  density?: "compact" | "full";
  className?: string;
  /** Full route's [min, max] order_index and total stop count. Only needed
   * in `compact` mode when `stops` holds just the origin/destination pair
   * (e.g. a search result row) rather than every stop on the route — lets
   * the proportional bar still reflect the segment's true position within
   * the larger graph instead of always rendering as 0%→100%. */
  routeSpan?: { start: number; end: number; stopCount: number };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Visualizes a trip's full N-stop route with the booked/searched segment
 * called out — the passenger-facing proof that this is a graph, not an
 * A-to-B line. `compact` renders as a single proportional bar (used in
 * search result rows); `full` renders every stop as a vertical stepper
 * (used on the trip/seat-selection page).
 */
export function RouteTimeline({ stops, originOrderIndex, destinationOrderIndex, density = "compact", className, routeSpan }: RouteTimelineProps) {
  const sorted = [...stops].sort((a, b) => a.orderIndex - b.orderIndex);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return null;

  const origin = sorted.find((s) => s.orderIndex === originOrderIndex);
  const destination = sorted.find((s) => s.orderIndex === destinationOrderIndex);

  if (density === "compact") {
    const rangeStart = routeSpan?.start ?? first.orderIndex;
    const rangeEnd = routeSpan?.end ?? last.orderIndex;
    const totalStops = routeSpan?.stopCount ?? sorted.length;
    const span = rangeEnd - rangeStart || 1;
    const segStart = ((originOrderIndex - rangeStart) / span) * 100;
    const segEnd = ((destinationOrderIndex - rangeStart) / span) * 100;

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-lg tabular-nums text-ink">{origin ? formatTime(origin.scheduledTime) : "—"}</div>
            <div className="text-xs text-ink-tertiary">{origin?.city}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg tabular-nums text-ink">{destination ? formatTime(destination.scheduledTime) : "—"}</div>
            <div className="text-xs text-ink-tertiary">{destination?.city}</div>
          </div>
        </div>

        <div className="relative h-1.5 w-full rounded-full bg-white/[0.06]">
          <div
            className="absolute inset-y-0 rounded-full bg-accent"
            style={{ left: `${segStart}%`, width: `${Math.max(segEnd - segStart, 2)}%` }}
          />
          {sorted.map((s) => {
            const pos = ((s.orderIndex - rangeStart) / span) * 100;
            const inSegment = s.orderIndex >= originOrderIndex && s.orderIndex <= destinationOrderIndex;
            return (
              <span
                key={s.routeStopId}
                className={cn(
                  "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  inSegment ? "bg-white" : "bg-white/25"
                )}
                style={{ left: `${pos}%` }}
                title={`${s.name} · ${formatTime(s.scheduledTime)}`}
              />
            );
          })}
        </div>

        {totalStops > 2 && (
          <div className="text-xs text-ink-tertiary">
            {totalStops} stops on this route · boarding at stop {originOrderIndex - rangeStart + 1}, alighting at stop{" "}
            {destinationOrderIndex - rangeStart + 1}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {sorted.map((s, i) => {
        const inSegment = s.orderIndex >= originOrderIndex && s.orderIndex <= destinationOrderIndex;
        const isOrigin = s.orderIndex === originOrderIndex;
        const isDestination = s.orderIndex === destinationOrderIndex;
        const isLast = i === sorted.length - 1;
        const isEndpoint = isOrigin || isDestination;

        return (
          <div key={s.routeStopId} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[7px] top-4 h-full w-px",
                  inSegment ? "bg-accent" : "bg-white/10"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-1 flex size-[15px] shrink-0 items-center justify-center rounded-full border-2",
                isEndpoint
                  ? "border-accent bg-canvas"
                  : inSegment
                    ? "border-accent/50 bg-accent/20"
                    : "border-white/15 bg-canvas"
              )}
            >
              {isEndpoint && <span className="size-1.5 rounded-full bg-accent" />}
            </span>

            <div className={cn("flex flex-1 items-start justify-between gap-3", !inSegment && "opacity-45")}>
              <div>
                <div className={cn("text-sm", isEndpoint ? "font-semibold text-ink" : "text-ink-secondary")}>{s.name}</div>
                <div className="text-xs text-ink-tertiary">{s.city}</div>
              </div>
              <div className={cn("font-mono text-sm tabular-nums", isEndpoint ? "text-ink" : "text-ink-tertiary")}>
                {formatTime(s.scheduledTime)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
