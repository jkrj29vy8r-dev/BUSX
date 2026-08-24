"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatClockTime } from "@/lib/format-date";

export interface TimelineStop {
  routeStopId: string;
  name: string;
  city: string;
  orderIndex: number;
  scheduledTime: string; // ISO
}

interface RouteTimelineBarProps {
  stops: TimelineStop[];
  originOrderIndex: number;
  destinationOrderIndex: number;
  className?: string;
  /** Full route's [min, max] order_index and total stop count — needed when
   * `stops` holds only the origin/destination pair (a search result card
   * doesn't have the full route loaded) so the bar still reflects this
   * segment's true position within the larger graph. */
  routeSpan?: { start: number; end: number; stopCount: number };
}

function formatTime(iso: string): string {
  return formatClockTime(new Date(iso));
}

const intermediateCount = (start: number, end: number, orig: number, dest: number) =>
  Math.max(0, dest - orig - 1);

/**
 * The trip card's "live interactive route timeline bar" — a proportional
 * strip showing where the searched segment sits within the full multi-stop
 * route, with a hoverable count of the stops in between.
 */
export function RouteTimelineBar({ stops, originOrderIndex, destinationOrderIndex, className, routeSpan }: RouteTimelineBarProps) {
  const [hovered, setHovered] = useState<TimelineStop | null>(null);
  const sorted = [...stops].sort((a, b) => a.orderIndex - b.orderIndex);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return null;

  const origin = sorted.find((s) => s.orderIndex === originOrderIndex);
  const destination = sorted.find((s) => s.orderIndex === destinationOrderIndex);

  const rangeStart = routeSpan?.start ?? first.orderIndex;
  const rangeEnd = routeSpan?.end ?? last.orderIndex;
  const totalStops = routeSpan?.stopCount ?? sorted.length;
  const span = rangeEnd - rangeStart || 1;
  const segStart = ((originOrderIndex - rangeStart) / span) * 100;
  const segEnd = ((destinationOrderIndex - rangeStart) / span) * 100;
  const between = intermediateCount(rangeStart, rangeEnd, originOrderIndex, destinationOrderIndex);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-lg font-bold tabular-nums text-ink">{origin ? formatTime(origin.scheduledTime) : "—"}</div>
          <div className="text-xs text-ink-tertiary">{origin?.city}</div>
        </div>
        {between > 0 && (
          <div className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] font-semibold text-ink-tertiary">
            {between} {between === 1 ? "stație" : "stații"} intermediare
          </div>
        )}
        <div className="text-right">
          <div className="font-mono text-lg font-bold tabular-nums text-ink">{destination ? formatTime(destination.scheduledTime) : "—"}</div>
          <div className="text-xs text-ink-tertiary">{destination?.city}</div>
        </div>
      </div>

      <div className="relative h-2 w-full rounded-full bg-ink/[0.06]">
        <motion.div
          layout
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-electric to-electric-hover"
          initial={{ width: 0 }}
          animate={{ left: `${segStart}%`, width: `${Math.max(segEnd - segStart, 2)}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
        {sorted.map((s) => {
          const pos = ((s.orderIndex - rangeStart) / span) * 100;
          const inSegment = s.orderIndex >= originOrderIndex && s.orderIndex <= destinationOrderIndex;
          const isEndpoint = s.orderIndex === originOrderIndex || s.orderIndex === destinationOrderIndex;
          return (
            <button
              key={s.routeStopId}
              type="button"
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered((h) => (h === s ? null : h))}
              onClick={(e) => e.preventDefault()}
              className={cn(
                "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-150",
                isEndpoint ? "size-2.5 bg-white ring-2 ring-electric" : inSegment ? "size-1.5 bg-white" : "size-1.5 bg-ink/25"
              )}
              style={{ left: `${pos}%` }}
            />
          );
        })}

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute -top-9 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] font-medium text-white shadow-panel"
              style={{ left: `${((hovered.orderIndex - rangeStart) / span) * 100}%` }}
            >
              {hovered.city} · {formatTime(hovered.scheduledTime)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {totalStops > 2 && (
        <div className="text-xs text-ink-tertiary">
          {totalStops} stații pe acest traseu · urcare la stația {originOrderIndex - rangeStart + 1}, coborâre la stația{" "}
          {destinationOrderIndex - rangeStart + 1}
        </div>
      )}
    </div>
  );
}
