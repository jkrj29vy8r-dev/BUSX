"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, SearchIcon } from "lucide-react";
import { formatWeekdayDate } from "@/lib/format-date";
import { StopAutocomplete } from "@/components/stop-autocomplete";
import { PassengerStepper } from "@/components/passenger-stepper";
import { RouteSwapButton } from "@/components/route-swap-button";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { StopRow } from "@/types/database";

function todayLocalMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date): string {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/**
 * The homepage's control deck: a dark-slate glass panel floating on the
 * light canvas (deliberate inversion for contrast, not a centered white
 * card on white). Origin/destination overlap a swap button at their seam —
 * the classic travel-search tell — with date and passengers as a second,
 * asymmetric row leading into a full-bleed electric CTA.
 */
export function SearchHero() {
  const router = useRouter();
  const [origin, setOrigin] = useState<StopRow | null>(null);
  const [destination, setDestination] = useState<StopRow | null>(null);
  const [date, setDate] = useState<Date>(todayLocalMidnight());
  const [passengers, setPassengers] = useState(1);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const canSearch = Boolean(origin && destination && origin.id !== destination.id && date);

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) return;
    const params = new URLSearchParams({
      originStopId: origin.id,
      destinationStopId: destination.id,
      originLabel: origin.city,
      destinationLabel: destination.city,
      date: toISODate(date),
      passengers: String(passengers),
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border-dark bg-surface-dark texture-noise p-6 shadow-panel-dark sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-dark-grid-fade" />

      <div className="relative">
        <div className="mb-6 flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald" />
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-onDarkSecondary">
            Live, la toți operatorii
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StopAutocomplete label="De la" placeholder="Oraș sau stație de plecare" value={origin} onChange={setOrigin} />
            <StopAutocomplete label="Până la" placeholder="Oraș sau stație de destinație" value={destination} onChange={setDestination} />

            <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 translate-y-1 sm:block">
              <RouteSwapButton onSwap={handleSwap} />
            </div>
            <div className="flex justify-center sm:hidden">
              <RouteSwapButton onSwap={handleSwap} className="rotate-90" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr_auto]">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-onDarkSecondary">Data plecării</label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-14 items-center gap-2.5 rounded-md border border-border bg-white px-3.5 text-left text-md font-medium text-ink transition-colors hover:border-border-hover focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric-muted"
                  >
                    <CalendarDays className="size-4 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
                    {formatWeekdayDate(date)}
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d);
                        setDatePopoverOpen(false);
                      }
                    }}
                    disabled={{ before: todayLocalMidnight() }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <PassengerStepper value={passengers} onChange={setPassengers} />

            <motion.div whileTap={{ scale: 0.98 }} className="flex sm:items-end">
              <Button
                type="submit"
                variant="electric"
                size="lg"
                disabled={!canSearch}
                className="h-14 w-full gap-2 sm:w-auto sm:px-8"
              >
                <SearchIcon className="size-4" strokeWidth={2.25} />
                Caută
              </Button>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}
