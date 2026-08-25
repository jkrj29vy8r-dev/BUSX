"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResult, StopRow } from "@/types/database";

async function fetchStops(q: string): Promise<StopRow[]> {
  if (q.trim().length === 0) return [];
  const res = await fetch(`/api/stops/search?q=${encodeURIComponent(q)}`);
  const body = (await res.json()) as ApiResult<StopRow[]>;
  if (!body.ok) throw new Error(body.error.message);
  return body.data;
}

export function useStopSearch(query: string) {
  return useQuery({
    queryKey: ["stop-search", query],
    queryFn: () => fetchStops(query),
    enabled: query.trim().length > 0,
    staleTime: 60_000,
  });
}
