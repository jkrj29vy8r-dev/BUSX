"use client";

import { Loader2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { MetroTimeline } from "@/components/metro-timeline";
import { MapPinPreview } from "@/components/map-pin-preview";
import { useTripDetail } from "@/hooks/use-trip-detail";
import type { RouteStopId, TripId } from "@/types/database";

interface RouteItineraryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: TripId;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
  companyName: string;
}

export function RouteItineraryDrawer({
  open,
  onOpenChange,
  tripId,
  originRouteStopId,
  destinationRouteStopId,
  companyName,
}: RouteItineraryDrawerProps) {
  // Lazily fetched — the search-result card only carries origin/destination,
  // not the full station list, so we pull it on first open.
  const { data: tripDetail, isLoading } = useTripDetail(open ? tripId : null);

  const origin = tripDetail?.stops.find((s) => s.routeStopId === originRouteStopId);
  const destination = tripDetail?.stops.find((s) => s.routeStopId === destinationRouteStopId);
  const highlightIndex = tripDetail?.stops.findIndex((s) => s.routeStopId === destinationRouteStopId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Traseul cursei" subtitle={companyName}>
      {isLoading && (
        <div className="flex h-64 items-center justify-center text-ink-tertiary">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {tripDetail && origin && destination && (
        <div className="flex flex-col gap-6">
          <MapPinPreview
            className="h-40 w-full"
            stops={tripDetail.stops.map((s) => ({ name: s.city, latitude: s.latitude, longitude: s.longitude }))}
            highlightIndex={highlightIndex}
          />

          <div>
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Traseu complet</div>
                <div className="text-sm font-medium text-ink">{tripDetail.route.name}</div>
              </div>
              <div className="text-right text-xs text-ink-tertiary">{tripDetail.stops.length} stații</div>
            </div>

            <MetroTimeline
              stops={tripDetail.stops.map((s) => ({
                routeStopId: s.routeStopId,
                name: s.name,
                city: s.city,
                orderIndex: s.orderIndex,
                scheduledTime: s.scheduledDeparture,
              }))}
              originOrderIndex={origin.orderIndex}
              destinationOrderIndex={destination.orderIndex}
            />
          </div>
        </div>
      )}
    </Drawer>
  );
}
