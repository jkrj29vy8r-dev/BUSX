"use client";

import { useMemo } from "react";
import { Armchair, Ban } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SeatAvailability, SeatId, SeatLayout } from "@/types/database";

interface SeatMapProps {
  layout: SeatLayout;
  seats: SeatAvailability[];
  selectedSeatIds: Set<SeatId>;
  pendingSeatIds?: Set<SeatId>; // optimistic: lock request in flight
  onToggleSeat: (seat: SeatAvailability) => void;
  maxSelectable?: number;
  className?: string;
}

/**
 * Renders the vehicle's seat grid straight from `vehicle.seat_layout` +
 * per-segment availability. This is the visual proof of dynamic segment
 * capacity: the exact same trip/vehicle renders a different availability
 * pattern depending on which segment was searched, because `seats` was
 * computed server-side for that segment only.
 */
export function SeatMap({ layout, seats, selectedSeatIds, pendingSeatIds, onToggleSeat, maxSelectable, className }: SeatMapProps) {
  const byDeck = useMemo(() => {
    const decks = new Map<number, SeatAvailability[]>();
    for (const seat of seats) {
      const list = decks.get(seat.deck) ?? [];
      list.push(seat);
      decks.set(seat.deck, list);
    }
    return [...decks.entries()].sort(([a], [b]) => a - b);
  }, [seats]);

  const disabledCells = new Set((layout.disabledCells ?? []).map(([r, c]) => `${r}:${c}`));
  const atCapacity = maxSelectable !== undefined && selectedSeatIds.size >= maxSelectable;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {byDeck.map(([deck, deckSeats]) => (
        <div key={deck} className="rounded-lg border border-border bg-surface-sunken p-4">
          {byDeck.length > 1 && (
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-tertiary">
              {deck === 1 ? "Lower deck" : `Deck ${deck}`}
            </div>
          )}
          <div
            className="grid w-fit gap-x-1.5 gap-y-2"
            style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0,1fr))` }}
          >
            {Array.from({ length: layout.rows }).map((_, rowIdx) =>
              Array.from({ length: layout.cols }).map((_, colIdx) => {
                const seat = deckSeats.find((s) => s.rowNumber === rowIdx && s.colPosition === colIdx);
                const cellKey = `${rowIdx}:${colIdx}`;
                const isAisle = colIdx === layout.aisleAfterCol;

                if (disabledCells.has(cellKey) || !seat) {
                  return (
                    <div
                      key={cellKey}
                      className={cn("size-9", isAisle && "mr-3")}
                      aria-hidden
                    />
                  );
                }

                const isSelected = selectedSeatIds.has(seat.seatId);
                const isPending = pendingSeatIds?.has(seat.seatId);
                const isBlocked = !seat.isAvailable && !isSelected;
                const isDisabledByCapacity = atCapacity && !isSelected && seat.isAvailable;

                return (
                  <button
                    key={cellKey}
                    type="button"
                    disabled={isBlocked || isDisabledByCapacity}
                    onClick={() => onToggleSeat(seat)}
                    title={`Seat ${seat.seatNumber}${isBlocked ? " · taken for this segment" : ""}`}
                    className={cn(
                      "relative flex size-9 items-center justify-center rounded-md border text-[11px] font-medium tabular-nums",
                      "transition-all duration-150 ease-snap",
                      isAisle && "mr-3",
                      !isBlocked && !isDisabledByCapacity && "hover:-translate-y-0.5",
                      isSelected &&
                        "border-accent bg-accent text-white shadow-glow",
                      !isSelected &&
                        !isBlocked &&
                        !isDisabledByCapacity &&
                        "border-border bg-surface text-ink-secondary hover:border-accent/60 hover:text-ink",
                      isDisabledByCapacity && "border-border/60 bg-surface text-ink-tertiary/50 cursor-not-allowed",
                      isBlocked && "border-transparent bg-white/[0.04] text-ink-tertiary/40 cursor-not-allowed"
                    )}
                  >
                    {isPending ? (
                      <span className="size-2 animate-pulse rounded-full bg-white" />
                    ) : isBlocked ? (
                      <Ban className="size-3.5" strokeWidth={1.5} />
                    ) : (
                      seat.seatNumber
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ))}

      <SeatMapLegend />
    </div>
  );
}

function SeatMapLegend() {
  const items: Array<{ label: string; swatch: string }> = [
    { label: "Available", swatch: "border border-border bg-surface" },
    { label: "Selected", swatch: "border border-accent bg-accent" },
    { label: "Taken for this segment", swatch: "border border-transparent bg-white/[0.04]" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-tertiary">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded-[4px]", item.swatch)} />
          {item.label}
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <Armchair className="size-3.5" strokeWidth={1.5} />
        seat number
      </div>
    </div>
  );
}
