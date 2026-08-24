"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Calendar, SearchIcon } from "lucide-react";
import { StopAutocomplete } from "@/components/stop-autocomplete";
import { PassengerStepper } from "@/components/passenger-stepper";
import { Button } from "@/components/ui/button";
import type { StopRow } from "@/types/database";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SearchForm() {
  const router = useRouter();
  const [origin, setOrigin] = useState<StopRow | null>(null);
  const [destination, setDestination] = useState<StopRow | null>(null);
  const [date, setDate] = useState(todayISODate());
  const [passengers, setPassengers] = useState(1);

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
      date,
      passengers: String(passengers),
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <StopAutocomplete label="From" placeholder="Origin city or station" value={origin} onChange={setOrigin} />

        <div className="flex items-end justify-center pb-1 sm:pb-2.5">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap origin and destination"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-surface-raised text-ink-secondary transition-all duration-150 ease-snap hover:border-accent hover:text-accent hover:rotate-180"
          >
            <ArrowRightLeft className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <StopAutocomplete label="To" placeholder="Destination city or station" value={destination} onChange={setDestination} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-tertiary">Departure date</label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary" strokeWidth={1.5} />
            <input
              type="date"
              value={date}
              min={todayISODate()}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 w-full rounded-md border border-border bg-surface-sunken pl-9 pr-3 text-md text-ink transition-colors duration-150 hover:border-border-hover focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent [color-scheme:dark]"
            />
          </div>
        </div>

        <PassengerStepper value={passengers} onChange={setPassengers} className="sm:w-44" />
      </div>

      <Button type="submit" variant="accent" size="lg" disabled={!canSearch} className="mt-1 w-full">
        <SearchIcon className="size-4" strokeWidth={2} />
        Search buses
      </Button>
    </form>
  );
}
