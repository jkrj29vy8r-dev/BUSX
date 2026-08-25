"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResult, TripDetail, TripId } from "@/types/database";

async function fetchTripDetail(tripId: TripId): Promise<TripDetail> {
  const res = await fetch(`/api/trips/${tripId}`);
  const body = (await res.json()) as ApiResult<TripDetail>;
  if (!body.ok) throw new Error(body.error.message);
  return body.data;
}

export function useTripDetail(tripId: TripId | null) {
  return useQuery({
    queryKey: ["trip-detail", tripId],
    queryFn: () => fetchTripDetail(tripId!),
    enabled: Boolean(tripId),
    staleTime: 60_000,
  });
}
