"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiResult,
  OperatorCompanySummary,
  OperatorOverview,
  OperatorPricingCell,
  OperatorRouteDetail,
  OperatorRouteSummary,
  OperatorTripSummary,
  RouteId,
  UpdatePricingCellInput,
} from "@/types/database";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = (await res.json()) as ApiResult<T>;
  if (!body.ok) throw new Error(body.error.message);
  return body.data;
}

export function useOperatorCompanies() {
  return useQuery({
    queryKey: ["operator-companies"],
    queryFn: () => fetchJson<OperatorCompanySummary[]>(`/api/operator`),
    staleTime: 5 * 60_000,
  });
}

export function useOperatorCompany(companySlug: string) {
  return useQuery({
    queryKey: ["operator-company", companySlug],
    queryFn: () => fetchJson<OperatorCompanySummary>(`/api/operator/${companySlug}`),
    staleTime: 5 * 60_000,
  });
}

export function useOperatorOverview(companySlug: string) {
  return useQuery({
    queryKey: ["operator-overview", companySlug],
    queryFn: () => fetchJson<OperatorOverview>(`/api/operator/${companySlug}/overview`),
    staleTime: 15_000,
    refetchInterval: 30_000, // "live" seat-lock count is only meaningful if it actually refreshes
  });
}

export function useOperatorRoutes(companySlug: string) {
  return useQuery({
    queryKey: ["operator-routes", companySlug],
    queryFn: () => fetchJson<OperatorRouteSummary[]>(`/api/operator/${companySlug}/routes`),
    staleTime: 30_000,
  });
}

export function useOperatorRouteDetail(companySlug: string, routeId: RouteId | null) {
  return useQuery({
    queryKey: ["operator-route-detail", companySlug, routeId],
    queryFn: () => fetchJson<OperatorRouteDetail>(`/api/operator/${companySlug}/routes/${routeId}`),
    enabled: Boolean(routeId),
    staleTime: 30_000,
  });
}

export function useOperatorTrips(companySlug: string) {
  return useQuery({
    queryKey: ["operator-trips", companySlug],
    queryFn: () => fetchJson<OperatorTripSummary[]>(`/api/operator/${companySlug}/trips`),
    staleTime: 15_000,
  });
}

export function useUpdatePricingCell(companySlug: string, routeId: RouteId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePricingCellInput) => {
      const res = await fetch(`/api/operator/${companySlug}/routes/${routeId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await res.json()) as ApiResult<OperatorPricingCell>;
      if (!body.ok) throw new Error(body.error.message);
      return body.data;
    },
    onSuccess: (cell) => {
      queryClient.setQueryData<OperatorRouteDetail | undefined>(
        ["operator-route-detail", companySlug, routeId],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pricingCells: prev.pricingCells.map((c) =>
              c.originRouteStopId === cell.originRouteStopId && c.destinationRouteStopId === cell.destinationRouteStopId
                ? cell
                : c
            ),
          };
        }
      );
    },
  });
}
