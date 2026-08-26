import { create } from "zustand";
import type { StopRow } from "@/types/database";

export interface PendingEdit {
  originStopId: string;
  originQuery: string;
  destinationStopId: string;
  destinationQuery: string;
  date: string; // YYYY-MM-DD
  passengers: number;
}

interface HomeSearchState {
  /** A city name a marketing section (the route map) wants pre-filled into
   * the homepage search dock's destination field — null once consumed. */
  pendingDestinationQuery: string | null;
  requestDestination: (cityQuery: string) => void;
  clearPendingDestination: () => void;

  /** A whole origin/destination pair, already resolved to real stops, that a
   * quick-route chip wants pre-filled into the search dock — null once
   * consumed. Unlike `pendingDestinationQuery` this carries resolved
   * `StopRow`s rather than raw city text, since the chip already looked
   * them up itself to show its own inline pending/error state. */
  pendingRoute: { origin: StopRow; destination: StopRow } | null;
  requestRoute: (origin: StopRow, destination: StopRow) => void;
  clearPendingRoute: () => void;

  /** "Edit search" from the results page: the stop IDs are already known
   * (they came from the URL that got the traveler to /search in the first
   * place), but the dock's fields need full `StopRow`s to display, so this
   * carries the raw city text + expected id and lets the dock re-resolve
   * and pick the exact match — same honest resolve-by-search the chips use,
   * not a fabricated partial StopRow. */
  pendingEdit: PendingEdit | null;
  requestEdit: (edit: PendingEdit) => void;
  clearPendingEdit: () => void;
}

/**
 * Deliberately separate from `useBookingStore` (which owns the real,
 * persisted checkout session) — this is throwaway UI coordination between
 * homepage sections that don't otherwise know about each other, gone the
 * moment it's consumed.
 */
export const useHomeSearchStore = create<HomeSearchState>()((set) => ({
  pendingDestinationQuery: null,
  requestDestination: (cityQuery) => set({ pendingDestinationQuery: cityQuery }),
  clearPendingDestination: () => set({ pendingDestinationQuery: null }),

  pendingRoute: null,
  requestRoute: (origin, destination) => set({ pendingRoute: { origin, destination } }),
  clearPendingRoute: () => set({ pendingRoute: null }),

  pendingEdit: null,
  requestEdit: (edit) => set({ pendingEdit: edit }),
  clearPendingEdit: () => set({ pendingEdit: null }),
}));
