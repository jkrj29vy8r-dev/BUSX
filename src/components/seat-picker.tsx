"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Ban, DoorOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SeatAvailability, SeatId, SeatLayout } from "@/types/database";

interface SeatPickerProps {
  layout: SeatLayout;
  seats: SeatAvailability[];
  selectedSeatIds: Set<SeatId>;
  pendingSeatIds?: Set<SeatId>; // optimistic: lock request in flight
  onToggleSeat: (seat: SeatAvailability) => void;
  maxSelectable?: number;
  standardPriceAmount?: number;
  premiumPriceAmount?: number | null;
  currency?: string;
  className?: string;
}

function SteeringWheel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
      <path d="M12 5.5v4.25M6.4 15.75l3.6-2.1M17.6 15.75l-3.6-2.1" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A tactile, realistic 2D bus interior — driver cabin + door at the front,
 * a real aisle gap, and (data-driven, not hardcoded) a contiguous back
 * bench row wherever the layout actually fills every column on the last
 * row. Four seat states: available, selected (brand mint glow), occupied for
 * this exact segment (dynamic capacity — the same seat can be open on a
 * different search), and VIP (premium seat_type, gold accent).
 *
 * The row/column/aisle grid comes from the vehicle's real `seat_layout`
 * (Fleet Builder-configured per vehicle), not a hardcoded 2x2/2x1 keyed off
 * vehicle type — a minibus and a coach can both exist in either layout, and
 * this renders whatever the operator actually configured.
 */
export function SeatPicker({
  layout,
  seats,
  selectedSeatIds,
  pendingSeatIds,
  onToggleSeat,
  maxSelectable,
  standardPriceAmount,
  premiumPriceAmount,
  currency = "RON",
  className,
}: SeatPickerProps) {
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
  const hasVipPricing = premiumPriceAmount != null && premiumPriceAmount !== standardPriceAmount;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {byDeck.map(([deck, deckSeats]) => {
        const fullRows = new Set(layout.fullWidthRows ?? []);

        return (
          <div key={deck} className="overflow-hidden rounded-xl border-2 border-ink/10 bg-white shadow-crisp">
            {/* Cockpit: driver cabin + front door */}
            <div className="flex items-center justify-between border-b-2 border-dashed border-ink/10 bg-surface-inset px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-ink-tertiary">
                <SteeringWheel className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Șofer</span>
              </div>
              {byDeck.length > 1 && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-tertiary">
                  {deck === 1 ? "Etaj inferior" : `Etaj ${deck}`}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-ink-tertiary">
                <span className="text-[10px] font-bold uppercase tracking-wide">Ușă</span>
                <DoorOpen className="size-4" strokeWidth={1.75} />
              </div>
            </div>

            <div className="bg-surface-inset p-4">
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: layout.rows }).map((_, rowIdx) => {
                  const isFullRow = fullRows.has(rowIdx);
                  return (
                    <div key={rowIdx} className="flex items-center gap-1.5">
                      {Array.from({ length: layout.cols }).map((_, colIdx) => {
                        const seat = deckSeats.find((s) => s.rowNumber === rowIdx && s.colPosition === colIdx);
                        const cellKey = `${rowIdx}:${colIdx}`;
                        const showAisleGap = !isFullRow && colIdx === layout.aisleAfterCol;

                        if (disabledCells.has(cellKey) || !seat) {
                          return <div key={cellKey} className={cn("size-10", showAisleGap && "mr-4")} aria-hidden />;
                        }

                        return (
                          <SeatGlyph
                            key={cellKey}
                            seat={seat}
                            isSelected={selectedSeatIds.has(seat.seatId)}
                            isPending={pendingSeatIds?.has(seat.seatId) ?? false}
                            isDisabledByCapacity={atCapacity && seat.isAvailable && !selectedSeatIds.has(seat.seatId)}
                            className={showAisleGap ? "mr-4" : undefined}
                            onToggle={() => onToggleSeat(seat)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <SeatPickerLegend hasVipPricing={hasVipPricing} standardPriceAmount={standardPriceAmount} premiumPriceAmount={premiumPriceAmount} currency={currency} />
    </div>
  );
}

function SeatGlyph({
  seat,
  isSelected,
  isPending,
  isDisabledByCapacity,
  onToggle,
  className,
}: {
  seat: SeatAvailability;
  isSelected: boolean;
  isPending: boolean;
  isDisabledByCapacity: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const isVip = seat.seatType === "premium";
  const isBlocked = !seat.isAvailable && !isSelected;
  const isDisabled = isBlocked || isDisabledByCapacity;

  return (
    <motion.button
      type="button"
      disabled={isDisabled}
      onClick={onToggle}
      whileTap={isDisabled ? undefined : { scale: 0.92 }}
      animate={isSelected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      title={`Locul ${seat.seatNumber}${isVip ? " · VIP" : ""}${isBlocked ? " · ocupat pentru acest segment" : ""}`}
      className={cn("relative flex size-10 items-center justify-center", className)}
    >
      {/* headrest */}
      <span
        className={cn(
          "absolute top-0 h-2.5 w-5 rounded-t-[5px] border-x-2 border-t-2",
          isSelected ? "border-emerald bg-emerald" : isBlocked ? "border-slate-200 bg-slate-200" : isVip ? "border-gold/60 bg-gold/10" : "border-ink/15 bg-white"
        )}
      />
      {/* seat base */}
      <span
        className={cn(
          "relative flex size-9 translate-y-1 items-center justify-center rounded-md border-2 text-[11px] font-bold tabular-nums transition-colors duration-150",
          isSelected && "border-emerald bg-emerald text-white shadow-glow-emerald",
          isVip && !isSelected && !isBlocked && "border-gold bg-gold/[0.07] text-gold",
          !isSelected &&
            !isVip &&
            !isBlocked &&
            !isDisabledByCapacity &&
            "border-ink/15 bg-white text-ink-secondary hover:border-emerald hover:bg-emerald-muted hover:text-emerald",
          isDisabledByCapacity && !isBlocked && "border-ink/10 bg-white text-ink-tertiary/40 cursor-not-allowed",
          isBlocked && "border-slate-200 bg-slate-200 text-slate-400 cursor-not-allowed"
        )}
      >
        {isPending ? (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="size-2 rounded-full bg-white"
          />
        ) : isBlocked ? (
          <Ban className="size-3.5" strokeWidth={1.75} />
        ) : (
          seat.seatNumber
        )}
        {isVip && !isBlocked && !isPending && (
          <Sparkles
            className={cn("absolute -right-1 -top-1 size-3", isSelected ? "text-white" : "text-gold")}
            strokeWidth={2.5}
            fill="currentColor"
          />
        )}
      </span>
    </motion.button>
  );
}

function SeatPickerLegend({
  hasVipPricing,
  standardPriceAmount,
  premiumPriceAmount,
  currency,
}: {
  hasVipPricing: boolean;
  standardPriceAmount?: number;
  premiumPriceAmount?: number | null;
  currency: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-tertiary">
      <LegendItem swatch="border-2 border-ink/15 bg-white" label={standardPriceAmount != null ? `Liber · ${standardPriceAmount.toFixed(0)} ${currency}` : "Liber"} />
      <LegendItem swatch="border-2 border-emerald bg-emerald" label="Selectat" />
      <LegendItem swatch="border-2 border-slate-200 bg-slate-200" label="Ocupat pentru acest segment" />
      {hasVipPricing && (
        <LegendItem
          swatch="border-2 border-gold bg-gold/10"
          label={`VIP${premiumPriceAmount != null ? ` · ${premiumPriceAmount.toFixed(0)} ${currency}` : ""}`}
          icon={<Sparkles className="size-3 text-gold" strokeWidth={2.5} fill="currentColor" />}
        />
      )}
    </div>
  );
}

function LegendItem({ swatch, label, icon }: { swatch: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("relative size-3.5 rounded-[4px]", swatch)}>{icon && <span className="absolute -right-1 -top-1">{icon}</span>}</span>
      {label}
    </div>
  );
}
