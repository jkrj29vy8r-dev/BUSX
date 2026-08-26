"use client";

import { ArrowRight, CalendarDays, Pencil, SlidersHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchSummaryBarProps {
  originLabel: string;
  destinationLabel: string;
  dateLabel: string;
  passengers: number;
  resultCount: number | null;
  onEdit: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

/** Sticky bar directly under the (also sticky) main nav, restating the
 * active query so the traveler never loses context while scrolling a long
 * result list — plus the mobile-only entry point into the filters drawer,
 * since there's no sidebar to hold it there. */
export function SearchSummaryBar({
  originLabel,
  destinationLabel,
  dateLabel,
  passengers,
  resultCount,
  onEdit,
  onOpenFilters,
  activeFilterCount,
}: SearchSummaryBarProps) {
  return (
    <div className="sticky top-14 z-30 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
        <div className="flex items-center gap-2 text-md font-extrabold tracking-tight text-ink">
          <span className="truncate">{originLabel}</span>
          <ArrowRight className="size-4 shrink-0 text-ink-tertiary" strokeWidth={2} />
          <span className="truncate">{destinationLabel}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.5} />
            {dateLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" strokeWidth={1.5} />
            {passengers} {passengers === 1 ? "pasager" : "pasageri"}
          </span>
        </div>

        {resultCount !== null && (
          <span className="hidden text-sm text-ink-tertiary sm:inline">
            {resultCount} {resultCount === 1 ? "cursă găsită" : "curse găsite"}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onOpenFilters} className="gap-1.5 lg:hidden">
            <SlidersHorizontal className="size-3.5" strokeWidth={2} />
            Filtre
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-electric text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={onEdit} className="gap-1.5">
            <Pencil className="size-3.5" strokeWidth={2} />
            Editează căutarea
          </Button>
        </div>
      </div>
    </div>
  );
}
