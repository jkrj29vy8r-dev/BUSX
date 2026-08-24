"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResult, FareClass, StopId, TripSearchResult } from "@/types/database";

export interface TripSearchParams {
  originStopId: StopId;
  destinationStopId: StopId;
  date: string; // YYYY-MM-DD
  fareClass?: FareClass;
}

async function fetchTripSearch(params: TripSearchParams): Promise<TripSearchResult[]> {
  const search = new URLSearchParams({
    originStopId: params.originStopId,
    destinationStopId: params.destinationStopId,
    date: params.date,
    fareClass: params.fareClass ?? "standard",
  });
  const res = await fetch(`/api/trips/search?${search.toString()}`);
  const body = (await res.json()) as ApiResult<TripSearchResult[]>;
  if (!body.ok) throw new Error(body.error.message);
  return body.data;
}

/** Powers the search results page. Disabled until origin/destination/date are all set. */
export function useTripSearch(params: Partial<TripSearchParams>) {
  const isReady = Boolean(params.originStopId && params.destinationStopId && params.date);

  return useQuery({
    queryKey: ["trip-search", params.originStopId, params.destinationStopId, params.date, params.fareClass],
    queryFn: () => fetchTripSearch(params as TripSearchParams),
    enabled: isReady,
    staleTime: 30_000, // seat availability shifts fast; keep this short
  });
}
