import type { TripSearchResult } from "@/types/database";

export type DepartureBucket = "morning" | "midday" | "evening";
export type SortKey = "departure" | "price" | "duration";

export const DEPARTURE_BUCKET_LABELS: Record<DepartureBucket, string> = {
  morning: "Dimineață",
  midday: "Prânz",
  evening: "Seară",
};

export const DEPARTURE_BUCKET_RANGES: Record<DepartureBucket, string> = {
  morning: "05:00 – 11:59",
  midday: "12:00 – 16:59",
  evening: "17:00 – 04:59",
};

export const SORT_LABELS: Record<SortKey, string> = {
  departure: "Ora plecării",
  price: "Preț (crescător)",
  duration: "Durată (cea mai rapidă)",
};

export interface TripFiltersState {
  buckets: Set<DepartureBucket>;
  companyIds: Set<string>;
  sort: SortKey;
}

export function defaultTripFilters(): TripFiltersState {
  return { buckets: new Set(), companyIds: new Set(), sort: "departure" };
}

export function departureBucketOf(iso: string): DepartureBucket {
  const hour = new Date(iso).getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "midday";
  return "evening";
}

function durationMinutes(result: TripSearchResult): number {
  return (new Date(result.destination.scheduledArrival).getTime() - new Date(result.origin.scheduledDeparture).getTime()) / 60_000;
}

export interface OperatorOption {
  id: string;
  name: string;
  count: number;
}

/** Unique operators actually present in this day's real results, each with
 * how many trips they have — never a fixed operator list. */
export function operatorOptionsFrom(results: TripSearchResult[]): OperatorOption[] {
  const byId = new Map<string, OperatorOption>();
  for (const r of results) {
    const existing = byId.get(r.company.id);
    if (existing) existing.count += 1;
    else byId.set(r.company.id, { id: r.company.id, name: r.company.name, count: 1 });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function applyTripFilters(results: TripSearchResult[], filters: TripFiltersState): TripSearchResult[] {
  let filtered = results;

  if (filters.buckets.size > 0) {
    filtered = filtered.filter((r) => filters.buckets.has(departureBucketOf(r.origin.scheduledDeparture)));
  }
  if (filters.companyIds.size > 0) {
    filtered = filtered.filter((r) => filters.companyIds.has(r.company.id));
  }

  const sorted = [...filtered];
  switch (filters.sort) {
    case "price":
      sorted.sort((a, b) => a.price.amount - b.price.amount);
      break;
    case "duration":
      sorted.sort((a, b) => durationMinutes(a) - durationMinutes(b));
      break;
    case "departure":
    default:
      sorted.sort((a, b) => new Date(a.origin.scheduledDeparture).getTime() - new Date(b.origin.scheduledDeparture).getTime());
      break;
  }
  return sorted;
}

export function activeFilterCount(filters: TripFiltersState): number {
  return filters.buckets.size + filters.companyIds.size;
}
