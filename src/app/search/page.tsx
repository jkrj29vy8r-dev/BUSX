"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, SearchX, Users } from "lucide-react";
import { Nav } from "@/components/nav";
import { TripCard } from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { useTripSearch } from "@/hooks/use-trip-search";
import { formatWeekdayDate } from "@/lib/format-date";
import type { StopId } from "@/types/database";

function formatDateLabel(dateStr: string): string {
  return formatWeekdayDate(new Date(`${dateStr}T00:00:00`));
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchResultsContent />
    </Suspense>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[168px] animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      </main>
    </div>
  );
}

function SearchResultsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const originStopId = params.get("originStopId") as StopId | null;
  const destinationStopId = params.get("destinationStopId") as StopId | null;
  const originLabel = params.get("originLabel") ?? "Plecare";
  const destinationLabel = params.get("destinationLabel") ?? "Destinație";
  const date = params.get("date") ?? new Date().toISOString().slice(0, 10);
  const passengers = Number(params.get("passengers") ?? "1");

  const { data: results, isLoading, isError } = useTripSearch({
    originStopId: originStopId ?? undefined,
    destinationStopId: destinationStopId ?? undefined,
    date,
  });

  return (
    <div className="min-h-screen">
      <Nav />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
            <span>{originLabel}</span>
            <ArrowRight className="size-4 text-ink-tertiary" strokeWidth={2} />
            <span>{destinationLabel}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-ink-secondary">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" strokeWidth={1.5} />
              {formatDateLabel(date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" strokeWidth={1.5} />
              {passengers} {passengers === 1 ? "pasager" : "pasageri"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="ml-auto">
              Modifică căutarea
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[168px] animate-pulse rounded-lg border border-border bg-surface" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/[0.06] p-6 text-sm text-danger">
            A apărut o eroare la încărcarea curselor. Te rugăm să încerci din nou.
          </div>
        )}

        {!isLoading && !isError && results?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface py-16 text-center">
            <SearchX className="size-8 text-ink-tertiary" strokeWidth={1.25} />
            <div className="text-md font-medium text-ink">Nicio cursă găsită</div>
            <p className="max-w-sm text-sm text-ink-secondary">
              Nu există plecări disponibile între {originLabel} și {destinationLabel} pe {formatDateLabel(date)}. Încearcă altă dată.
            </p>
          </div>
        )}

        {!isLoading && !isError && results && results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((result) => (
              <TripCard key={result.trip.id} result={result} passengers={passengers} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
