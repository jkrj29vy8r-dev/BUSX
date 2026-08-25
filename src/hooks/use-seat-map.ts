"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ApiResult, RouteStopId, SegmentSeatMap, TripId } from "@/types/database";

async function fetchSeatMap(tripId: TripId, originRouteStopId: RouteStopId, destinationRouteStopId: RouteStopId) {
  const search = new URLSearchParams({ originRouteStopId, destinationRouteStopId });
  const res = await fetch(`/api/trips/${tripId}/seats?${search.toString()}`);
  const body = (await res.json()) as ApiResult<SegmentSeatMap>;
  if (!body.ok) throw new Error(body.error.message);
  return body.data;
}

const seatMapQueryKey = (tripId: TripId, originRouteStopId: RouteStopId, destinationRouteStopId: RouteStopId) =>
  ["seat-map", tripId, originRouteStopId, destinationRouteStopId] as const;

/**
 * Fetches the segment-scoped seat map and keeps it live via Supabase
 * Realtime: any INSERT/UPDATE on `seat_locks` or `tickets` for this trip
 * invalidates the query, so a seat another passenger just locked greys out
 * within roughly one round trip — without polling.
 */
export function useSeatMap(
  tripId: TripId | null,
  originRouteStopId: RouteStopId | null,
  destinationRouteStopId: RouteStopId | null
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(tripId && originRouteStopId && destinationRouteStopId);

  const query = useQuery({
    queryKey: enabled ? seatMapQueryKey(tripId!, originRouteStopId!, destinationRouteStopId!) : ["seat-map", "disabled"],
    queryFn: () => fetchSeatMap(tripId!, originRouteStopId!, destinationRouteStopId!),
    enabled,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (!enabled) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`trip-${tripId}-seat-activity`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seat_locks", filter: `trip_id=eq.${tripId}` },
        () => queryClient.invalidateQueries({ queryKey: seatMapQueryKey(tripId!, originRouteStopId!, destinationRouteStopId!) })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `trip_id=eq.${tripId}` },
        () => queryClient.invalidateQueries({ queryKey: seatMapQueryKey(tripId!, originRouteStopId!, destinationRouteStopId!) })
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tripId, originRouteStopId, destinationRouteStopId]);

  return query;
}
