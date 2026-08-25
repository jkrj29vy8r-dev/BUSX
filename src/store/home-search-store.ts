import { create } from "zustand";

interface HomeSearchState {
  /** A city name a marketing section (the route map) wants pre-filled into
   * the homepage search dock's destination field — null once consumed. */
  pendingDestinationQuery: string | null;
  requestDestination: (cityQuery: string) => void;
  clearPendingDestination: () => void;
}

/**
 * Deliberately separate from `useBookingStore` (which owns the real,
 * persisted checkout session) — this is throwaway UI coordination between
 * two homepage sections that don't otherwise know about each other, gone
 * the moment it's consumed.
 */
export const useHomeSearchStore = create<HomeSearchState>()((set) => ({
  pendingDestinationQuery: null,
  requestDestination: (cityQuery) => set({ pendingDestinationQuery: cityQuery }),
  clearPendingDestination: () => set({ pendingDestinationQuery: null }),
}));
