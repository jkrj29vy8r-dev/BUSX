"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, SearchIcon, Users } from "lucide-react";
import { formatWeekdayDate } from "@/lib/format-date";
import { StopAutocomplete } from "@/components/stop-autocomplete";
import { PassengerStepper } from "@/components/passenger-stepper";
import { RouteSwapButton } from "@/components/route-swap-button";
import { RouteChips } from "@/components/hero/route-chips";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useHomeSearchStore } from "@/store/home-search-store";
import type { ApiResult, StopRow } from "@/types/database";

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
 * The homepage's control deck and the hero's one visual centerpiece.
 * Two markups share one form: a single-line pill (`md:` and up) matching
 * the Kayak/Google-Flights convention travelers already know, and the
 * original stacked card below `md` where a one-line dock would force
 * every field down to an unusable width.
 */
export function SearchHero() {
  const router = useRouter();
  const [origin, setOrigin] = useState<StopRow | null>(null);
  const [destination, setDestination] = useState<StopRow | null>(null);
  const [date, setDate] = useState<Date>(todayLocalMidnight());
  const [passengers, setPassengers] = useState(1);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const pendingDestinationQuery = useHomeSearchStore((s) => s.pendingDestinationQuery);
  const clearPendingDestination = useHomeSearchStore((s) => s.clearPendingDestination);
  const pendingRoute = useHomeSearchStore((s) => s.pendingRoute);
  const clearPendingRoute = useHomeSearchStore((s) => s.clearPendingRoute);

  // Quick-fill from the route map explorer further down the page: resolve
  // the requested city against the real stop-search API (same one the
  // autocomplete uses), then drop it straight into the destination field.
  useEffect(() => {
    if (!pendingDestinationQuery) return;
    let cancelled = false;
    fetch(`/api/stops/search?q=${encodeURIComponent(pendingDestinationQuery)}`)
      .then((res) => res.json() as Promise<ApiResult<StopRow[]>>)
      .then((body) => {
        if (cancelled || !body.ok) return;
        const match = body.data[0];
        if (match) setDestination(match);
      })
      .finally(() => {
        if (!cancelled) clearPendingDestination();
      });
    return () => {
      cancelled = true;
    };
  }, [pendingDestinationQuery, clearPendingDestination]);

  // Quick-fill from a popular-route chip: both stops are already resolved,
  // so just drop them straight in — the traveler still picks date/passengers
  // and hits search themselves.
  useEffect(() => {
    if (!pendingRoute) return;
    setOrigin(pendingRoute.origin);
    setDestination(pendingRoute.destination);
    clearPendingRoute();
  }, [pendingRoute, clearPendingRoute]);

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

  const dateTrigger = (bare: boolean) => (
    <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
      <PopoverTrigger asChild>
        {bare ? (
          <button
            type="button"
            className="flex h-full min-w-[9.5rem] flex-col justify-center border-l border-slate-200 px-4 py-2 text-left transition-colors hover:bg-slate-50"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary leading-none">Data plecării</span>
            <span className="mt-1 flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
              <CalendarDays className="size-3.5 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
              {formatWeekdayDate(date)}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="flex h-14 items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-3.5 text-left text-md font-medium text-ink transition-colors hover:border-border-hover focus:border-electric focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-muted"
          >
            <CalendarDays className="size-4 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
            {formatWeekdayDate(date)}
          </button>
        )}
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
  );

  const passengerTrigger = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-full min-w-[7rem] flex-col justify-center border-l border-slate-200 px-4 py-2 text-left transition-colors hover:bg-slate-50"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary leading-none">Pasageri</span>
          <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Users className="size-3.5 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
            {passengers}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <PassengerStepper value={passengers} onChange={setPassengers} />
      </PopoverContent>
    </Popover>
  );

  return (
    <div id="search-dock" className="relative">
      <form onSubmit={handleSubmit}>
        {/* Desktop / tablet: single-line pill dock */}
        <div className="hidden items-stretch rounded-full border border-slate-200/80 bg-white p-2 shadow-2xl md:flex">
          <StopAutocomplete
            variant="bare"
            className="min-w-0 flex-[1.3] px-4 py-1"
            label="De la"
            placeholder="Oraș de plecare"
            value={origin}
            onChange={setOrigin}
          />

          <div className="flex shrink-0 items-center px-1">
            <RouteSwapButton onSwap={handleSwap} />
          </div>

          <StopAutocomplete
            variant="bare"
            className="min-w-0 flex-[1.3] border-l border-slate-200 px-4 py-1"
            label="Până la"
            placeholder="Oraș de destinație"
            value={destination}
            onChange={setDestination}
          />

          {dateTrigger(true)}
          {passengerTrigger}

          <div className="flex shrink-0 items-center pl-2">
            <Button type="submit" variant="electric" size="lg" disabled={!canSearch} className="h-12 gap-2 rounded-full px-6">
              <SearchIcon className="size-4" strokeWidth={2.25} />
              Caută Curse Express
            </Button>
          </div>
        </div>

        {/* Mobile: stacked card */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl md:hidden">
          <div className="relative grid grid-cols-1 gap-3">
            <StopAutocomplete label="De la" placeholder="Oraș sau stație de plecare" value={origin} onChange={setOrigin} />
            <StopAutocomplete label="Până la" placeholder="Oraș sau stație de destinație" value={destination} onChange={setDestination} />
            <div className="flex justify-center">
              <RouteSwapButton onSwap={handleSwap} className="rotate-90" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">Data plecării</label>
              {dateTrigger(false)}
            </div>

            <PassengerStepper value={passengers} onChange={setPassengers} />

            <Button type="submit" variant="electric" size="lg" disabled={!canSearch} className="h-14 w-full gap-2">
              <SearchIcon className="size-4" strokeWidth={2.25} />
              Caută Curse Express
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">Rute populare</span>
        <RouteChips />
      </div>
    </div>
  );
}
