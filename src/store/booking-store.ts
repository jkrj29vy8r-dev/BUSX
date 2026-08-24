import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FareClass,
  RouteId,
  RouteStopId,
  SeatId,
  SeatLockId,
  TripId,
} from "@/types/database";

export interface SelectedSeat {
  seatId: SeatId;
  seatNumber: string;
  seatLockId: SeatLockId;
  lockExpiresAt: string; // ISO — drives the countdown UI
  fareClass: FareClass;
  priceAmount: number;
}

interface BookingState {
  sessionId: string;
  tripId: TripId | null;
  routeId: RouteId | null;
  originRouteStopId: RouteStopId | null;
  destinationRouteStopId: RouteStopId | null;
  selectedSeats: SelectedSeat[];

  startSegmentSelection: (params: {
    tripId: TripId;
    routeId: RouteId;
    originRouteStopId: RouteStopId;
    destinationRouteStopId: RouteStopId;
  }) => void;
  addSeat: (seat: SelectedSeat) => void;
  removeSeat: (seatId: SeatId) => void;
  clearExpiredSeats: () => void;
  reset: () => void;
}

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Client-side checkout state. This is intentionally thin: the source of
 * truth for "is this seat actually locked" is always the `seat_locks` table
 * (via Supabase Realtime + TanStack Query), never this store. The store
 * exists to (a) persist the passenger's in-progress selection across page
 * reloads within the same browser session and (b) drive the lock countdown
 * UI. `sessionId` is the correlation key sent with every seat-lock and
 * booking API call so a lock can only be released/converted by the browser
 * session that created it.
 */
export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      sessionId: generateSessionId(),
      tripId: null,
      routeId: null,
      originRouteStopId: null,
      destinationRouteStopId: null,
      selectedSeats: [],

      startSegmentSelection: ({ tripId, routeId, originRouteStopId, destinationRouteStopId }) => {
        const current = get();
        if (current.tripId !== tripId) {
          // Switching trips invalidates any in-progress selection for the old trip.
          set({ tripId, routeId, originRouteStopId, destinationRouteStopId, selectedSeats: [] });
        } else {
          set({ routeId, originRouteStopId, destinationRouteStopId });
        }
      },

      addSeat: (seat) => set((state) => ({ selectedSeats: [...state.selectedSeats, seat] })),

      removeSeat: (seatId) =>
        set((state) => ({ selectedSeats: state.selectedSeats.filter((s) => s.seatId !== seatId) })),

      clearExpiredSeats: () =>
        set((state) => ({
          selectedSeats: state.selectedSeats.filter((s) => new Date(s.lockExpiresAt).getTime() > Date.now()),
        })),

      reset: () =>
        set({
          tripId: null,
          routeId: null,
          originRouteStopId: null,
          destinationRouteStopId: null,
          selectedSeats: [],
        }),
    }),
    { name: "busx-booking-store" }
  )
);
