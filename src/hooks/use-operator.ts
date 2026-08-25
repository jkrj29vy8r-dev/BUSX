"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiResult,
  BoardingScanResult,
  OperatorCompanyProfile,
  OperatorCompanySummary,
  OperatorFleetVehicleSummary,
  OperatorOverview,
  OperatorPricingCell,
  OperatorRouteDetail,
  OperatorRouteSummary,
  OperatorTripManifest,
  OperatorTripSummary,
  OperatorVehicleDetail,
  RouteId,
  SaveFleetVehicleInput,
  TicketId,
  TripId,
  UpdateCompanyProfileInput,
  UpdatePricingCellInput,
  VehicleId,
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

// -- Carrier profile ----------------------------------------------------------

export function useOperatorProfile(companySlug: string) {
  return useQuery({
    queryKey: ["operator-profile", companySlug],
    queryFn: () => fetchJson<OperatorCompanyProfile>(`/api/operator/${companySlug}/profile`),
    staleTime: 30_000,
  });
}

export function useUpdateOperatorProfile(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCompanyProfileInput) => {
      const res = await fetch(`/api/operator/${companySlug}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await res.json()) as ApiResult<OperatorCompanyProfile>;
      if (!body.ok) throw new Error(body.error.message);
      return body.data;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["operator-profile", companySlug], profile);
      queryClient.invalidateQueries({ queryKey: ["operator-company", companySlug] });
    },
  });
}

// -- Fleet builder --------------------------------------------------------------

export function useOperatorFleet(companySlug: string) {
  return useQuery({
    queryKey: ["operator-fleet", companySlug],
    queryFn: () => fetchJson<OperatorFleetVehicleSummary[]>(`/api/operator/${companySlug}/fleet`),
    staleTime: 15_000,
  });
}

export function useOperatorVehicle(companySlug: string, vehicleId: VehicleId | null) {
  return useQuery({
    queryKey: ["operator-vehicle", companySlug, vehicleId],
    queryFn: () => fetchJson<OperatorVehicleDetail>(`/api/operator/${companySlug}/fleet/${vehicleId}`),
    enabled: Boolean(vehicleId),
    staleTime: 30_000,
  });
}

export function useSaveOperatorVehicle(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveFleetVehicleInput) => {
      const res = await fetch(`/api/operator/${companySlug}/fleet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await res.json()) as ApiResult<OperatorVehicleDetail>;
      if (!body.ok) throw new Error(body.error.message);
      return body.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator-fleet", companySlug] });
    },
  });
}

// -- Trip control & passenger manifest ------------------------------------------

export function useOperatorTripManifest(companySlug: string, tripId: TripId | null) {
  return useQuery({
    queryKey: ["operator-manifest", companySlug, tripId],
    queryFn: () => fetchJson<OperatorTripManifest>(`/api/operator/${companySlug}/trips/${tripId}/manifest`),
    enabled: Boolean(tripId),
    staleTime: 10_000,
    refetchInterval: 20_000, // "real-time" control: new bookings/check-ins should show up without a manual refresh
  });
}

export function useSetManifestCheckIn(companySlug: string, tripId: TripId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ticketId: TicketId; checkedIn: boolean }) => {
      const res = await fetch(`/api/operator/${companySlug}/trips/${tripId}/manifest/${input.ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkedIn: input.checkedIn }),
      });
      const body = (await res.json()) as ApiResult<{ status: string }>;
      if (!body.ok) throw new Error(body.error.message);
      return { ...body.data, ticketId: input.ticketId };
    },
    onSuccess: (result) => {
      queryClient.setQueryData<OperatorTripManifest | undefined>(["operator-manifest", companySlug, tripId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          passengers: prev.passengers.map((p) => (p.ticketId === result.ticketId ? { ...p, status: result.status as never } : p)),
        };
      });
    },
  });
}

// -- Conductor scanner ------------------------------------------------------------

export function useBoardingScan(companySlug: string, tripId: TripId) {
  return useMutation({
    mutationFn: async (qrString: string) => {
      const res = await fetch(`/api/operator/${companySlug}/trips/${tripId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrString }),
      });
      const body = (await res.json()) as ApiResult<BoardingScanResult>;
      if (!body.ok) throw new Error(body.error.message);
      return body.data;
    },
  });
}
