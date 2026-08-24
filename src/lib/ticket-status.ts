import type { TicketStatus, TripStatus } from "@/types/database";

export type LiveStatusTone = "neutral" | "emerald" | "electric" | "danger";

export interface LiveStatus {
  label: string;
  tone: LiveStatusTone;
  pulsing: boolean;
}

const BOARDING_WINDOW_MINUTES = 45;

/** Drives the wallet pass's live status pill. Pure function of time + known
 * statuses — no polling required beyond re-rendering with a fresh `now`. */
export function getTicketLiveStatus(params: {
  departureAtISO: string;
  ticketStatus: TicketStatus;
  tripStatus: TripStatus;
  now?: Date;
}): LiveStatus {
  const { departureAtISO, ticketStatus, tripStatus, now = new Date() } = params;

  if (ticketStatus === "cancelled" || ticketStatus === "refunded" || tripStatus === "cancelled") {
    return { label: "Anulat", tone: "danger", pulsing: false };
  }
  if (ticketStatus === "boarded") {
    return { label: "Îmbarcat", tone: "emerald", pulsing: false };
  }
  if (tripStatus === "completed") {
    return { label: "Finalizat", tone: "neutral", pulsing: false };
  }
  if (ticketStatus === "checked_in") {
    return { label: "Check-in făcut — se îmbarcă", tone: "emerald", pulsing: true };
  }
  if (tripStatus === "in_transit" || tripStatus === "departed") {
    return { label: "În cursă", tone: "electric", pulsing: true };
  }

  const minutesToDeparture = (new Date(departureAtISO).getTime() - now.getTime()) / 60_000;

  if (minutesToDeparture <= 0) {
    return { label: "Plecare acum", tone: "emerald", pulsing: true };
  }
  if (minutesToDeparture <= BOARDING_WINDOW_MINUTES) {
    return { label: `Îmbarcare în ${Math.ceil(minutesToDeparture)} min`, tone: "emerald", pulsing: true };
  }
  return { label: "Programat", tone: "neutral", pulsing: false };
}
