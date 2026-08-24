"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatClockTime } from "@/lib/format-date";

export interface MetroStop {
  routeStopId: string;
  name: string;
  city: string;
  orderIndex: number;
  scheduledTime: string; // ISO
}

interface MetroTimelineProps {
  stops: MetroStop[];
  originOrderIndex: number;
  destinationOrderIndex: number;
  className?: string;
}

function formatTime(iso: string): string {
  return formatClockTime(new Date(iso));
}

/**
 * Vertical metro-map-style stepper for the Route Itinerary Drawer: every
 * station on the trip, in order, with its exact scheduled time. The
 * passenger's actual segment (boarding → alighting) is drawn as a solid
 * electric line with large filled nodes; stops outside it are muted small
 * dots on a thin neutral line — same information as the card's compact bar,
 * at full station-by-station resolution.
 */
export function MetroTimeline({ stops, originOrderIndex, destinationOrderIndex, className }: MetroTimelineProps) {
  const sorted = [...stops].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className={cn("flex flex-col", className)}>
      {sorted.map((s, i) => {
        const inSegment = s.orderIndex >= originOrderIndex && s.orderIndex <= destinationOrderIndex;
        const isOrigin = s.orderIndex === originOrderIndex;
        const isDestination = s.orderIndex === destinationOrderIndex;
        const isEndpoint = isOrigin || isDestination;
        const isLast = i === sorted.length - 1;

        return (
          <motion.div
            key={s.routeStopId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.035, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex gap-4 pb-7 last:pb-0"
          >
            {!isLast && (
              <span
                className={cn("absolute left-[9px] top-5 h-full w-0.5", inSegment ? "bg-electric" : "bg-ink/10")}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 bg-white",
                isEndpoint ? "border-electric" : inSegment ? "border-electric/40" : "border-ink/15"
              )}
            >
              {isEndpoint && <span className="size-2 rounded-full bg-electric" />}
              {!isEndpoint && inSegment && <span className="size-1.5 rounded-full bg-electric/40" />}
            </span>

            <div className={cn("flex flex-1 items-start justify-between gap-3 pt-0.5", !inSegment && "opacity-40")}>
              <div>
                <div className={cn("text-sm", isEndpoint ? "font-bold text-ink" : "font-medium text-ink-secondary")}>
                  {s.name}
                  {isOrigin && (
                    <span className="ml-2 rounded-full bg-electric-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-electric">
                      Board
                    </span>
                  )}
                  {isDestination && (
                    <span className="ml-2 rounded-full bg-emerald-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-hover">
                      Alight
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-tertiary">{s.city}</div>
              </div>
              <div className={cn("font-mono text-sm font-semibold tabular-nums", isEndpoint ? "text-ink" : "text-ink-tertiary")}>
                {formatTime(s.scheduledTime)}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
