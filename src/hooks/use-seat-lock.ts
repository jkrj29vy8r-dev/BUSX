"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBookingStore } from "@/store/booking-store";
import type { ApiResult, FareClass, RouteStopId, SeatId, SeatLockResult, TripId } from "@/types/database";

interface CreateLockParams {
  tripId: TripId;
  seatId: SeatId;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
  // Carried through to the Zustand store on success — the API doesn't echo
  // these back, and the store needs them for the checkout summary UI.
  seatNumber: string;
  fareClass: FareClass;
  priceAmount: number;
}

/** POSTs a seat lock and, on success, invalidates the seat map so the UI
 * reflects the hold immediately rather than waiting on the Realtime echo. */
export function useCreateSeatLock() {
  const queryClient = useQueryClient();
  const sessionId = useBookingStore((s) => s.sessionId);
  const addSeat = useBookingStore((s) => s.addSeat);

  return useMutation({
    mutationFn: async (params: CreateLockParams) => {
      const { seatNumber, fareClass, priceAmount, ...apiParams } = params;
      void seatNumber;
      void fareClass;
      void priceAmount;
      const res = await fetch("/api/seat-locks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...apiParams, sessionId }),
      });
      const body = (await res.json()) as ApiResult<SeatLockResult>;
      if (!body.ok) throw new Error(body.error.message);
      return body.data;
    },
    onSuccess: (data, variables) => {
      addSeat({
        seatId: variables.seatId,
        seatNumber: variables.seatNumber,
        seatLockId: data.lock.id,
        lockExpiresAt: data.lock.expires_at,
        fareClass: variables.fareClass,
        priceAmount: variables.priceAmount,
      });
      queryClient.invalidateQueries({ queryKey: ["seat-map", variables.tripId] });
    },
  });
}

export function useReleaseSeatLock() {
  const queryClient = useQueryClient();
  const sessionId = useBookingStore((s) => s.sessionId);
  const removeSeat = useBookingStore((s) => s.removeSeat);

  return useMutation({
    mutationFn: async (params: { lockId: string; seatId: SeatId; tripId: TripId }) => {
      const res = await fetch("/api/seat-locks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId: params.lockId, sessionId }),
      });
      const body = (await res.json()) as ApiResult<{ released: true }>;
      if (!body.ok) throw new Error(body.error.message);
      return body.data;
    },
    onSuccess: (_data, variables) => {
      removeSeat(variables.seatId);
      queryClient.invalidateQueries({ queryKey: ["seat-map", variables.tripId] });
    },
  });
}

/**
 * Bulk-releases every active lock this checkout session is holding. Fired
 * from the checkout page's booking-failure handler: `issueTicketsForBooking`
 * runs as one transaction, so a failure (expired hold, a losing race on one
 * seat among several) means none of the session's locks converted to
 * tickets — they're still occupying a 10-minute hold nobody can use. This
 * frees them immediately instead of making other shoppers wait out the TTL.
 */
export function useReleaseAllSeatLocks() {
  const sessionId = useBookingStore((s) => s.sessionId);

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seat-locks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const body = (await res.json()) as ApiResult<{ released: true; count: number }>;
      if (!body.ok) throw new Error(body.error.message);
      return body.data;
    },
  });
}
