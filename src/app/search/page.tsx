"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { Nav } from "@/components/nav";
import { TripCard } from "@/components/trip-card";
import { SearchSummaryBar } from "@/components/search/search-summary-bar";
import { FiltersPanel } from "@/components/search/filters-panel";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useTripSearch } from "@/hooks/use-trip-search";
import { useHomeSearchStore } from "@/store/home-search-store";
import { formatWeekdayDate } from "@/lib/format-date";
import { applyTripFilters, activeFilterCount, defaultTripFilters, operatorOptionsFrom } from "@/lib/trip-filters";
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
  const requestEdit = useHomeSearchStore((s) => s.requestEdit);
  const [filters, setFilters] = useState(defaultTripFilters());
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

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

  const operators = useMemo(() => operatorOptionsFrom(results ?? []), [results]);
  const filteredResults = useMemo(() => applyTripFilters(results ?? [], filters), [results, filters]);
  const activeCount = activeFilterCount(filters);

  function handleEditSearch() {
    if (originStopId && destinationStopId) {
      requestEdit({
        originStopId,
        originQuery: originLabel,
        destinationStopId,
        destinationQuery: destinationLabel,
        date,
        passengers,
      });
    }
    router.push("/#search-dock");
  }

  return (
    <div className="min-h-screen">
      <Nav />

      <SearchSummaryBar
        originLabel={originLabel}
        destinationLabel={destinationLabel}
        dateLabel={formatDateLabel(date)}
        passengers={passengers}
        resultCount={results ? filteredResults.length : null}
        onEdit={handleEditSearch}
        onOpenFilters={() => setFiltersDrawerOpen(true)}
        activeFilterCount={activeCount}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex gap-8">
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-32 rounded-lg border border-border bg-white p-4">
              <FiltersPanel filters={filters} onChange={setFilters} operators={operators} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
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
                  Nu există plecări disponibile între {originLabel} și {destinationLabel} pe {formatDateLabel(date)}. Încearcă altă
                  dată.
                </p>
              </div>
            )}

            {!isLoading && !isError && results && results.length > 0 && filteredResults.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface py-16 text-center">
                <SearchX className="size-8 text-ink-tertiary" strokeWidth={1.25} />
                <div className="text-md font-medium text-ink">Niciun rezultat cu aceste filtre</div>
                <p className="max-w-sm text-sm text-ink-secondary">
                  {results.length} {results.length === 1 ? "cursă disponibilă" : "curse disponibile"} în total — încearcă să
                  relaxezi filtrele.
                </p>
                <Button variant="secondary" size="sm" onClick={() => setFilters(defaultTripFilters())}>
                  Resetează filtrele
                </Button>
              </div>
            )}

            {!isLoading && !isError && filteredResults.length > 0 && (
              <div className="flex flex-col gap-3">
                {filteredResults.map((result) => (
                  <TripCard key={result.trip.id} result={result} passengers={passengers} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Drawer open={filtersDrawerOpen} onOpenChange={setFiltersDrawerOpen} title="Filtre și sortare">
        <FiltersPanel filters={filters} onChange={setFilters} operators={operators} />
        <Button variant="electric" size="lg" className="mt-6 w-full" onClick={() => setFiltersDrawerOpen(false)}>
          Arată {filteredResults.length} {filteredResults.length === 1 ? "cursă" : "curse"}
        </Button>
      </Drawer>
    </div>
  );
}
