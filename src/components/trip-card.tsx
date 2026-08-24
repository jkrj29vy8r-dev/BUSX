import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import { CardInteractive } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RouteTimeline } from "@/components/route-timeline";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-labels";
import type { TripSearchResult } from "@/types/database";

interface TripCardProps {
  result: TripSearchResult;
  passengers: number;
}

export function TripCard({ result, passengers }: TripCardProps) {
  const { trip, company, origin, destination, price, availableSeatsCount, vehicleType, routeStopCount, routeStartOrderIndex, routeEndOrderIndex } = result;

  const durationMinutes = Math.round(
    (new Date(destination.scheduledArrival).getTime() - new Date(origin.scheduledDeparture).getTime()) / 60_000
  );
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  const href = `/trips/${trip.id}?originRouteStopId=${origin.routeStopId}&destinationRouteStopId=${destination.routeStopId}&passengers=${passengers}&price=${price.amount}&currency=${price.currency}&originLabel=${encodeURIComponent(origin.city)}&destinationLabel=${encodeURIComponent(destination.city)}`;
  const lowSeats = availableSeatsCount <= 5;

  return (
    <Link href={href}>
      <CardInteractive className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex size-6 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: company.brand_primary_color }}
            >
              {company.name.slice(0, 1)}
            </span>
            <span className="text-sm font-medium text-ink">{company.name}</span>
            {company.is_verified && <ShieldCheck className="size-3.5 text-accent" strokeWidth={2} />}
          </div>
          <Badge variant="neutral">{VEHICLE_TYPE_LABELS[vehicleType]}</Badge>
        </div>

        <RouteTimeline
          density="compact"
          stops={[
            { routeStopId: origin.routeStopId, name: origin.name, city: origin.city, orderIndex: origin.orderIndex, scheduledTime: origin.scheduledDeparture },
            { routeStopId: destination.routeStopId, name: destination.name, city: destination.city, orderIndex: destination.orderIndex, scheduledTime: destination.scheduledArrival },
          ]}
          originOrderIndex={origin.orderIndex}
          destinationOrderIndex={destination.orderIndex}
          routeSpan={{ start: routeStartOrderIndex, end: routeEndOrderIndex, stopCount: routeStopCount }}
        />

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-4 text-xs text-ink-tertiary">
            <span>
              {hours}h {minutes.toString().padStart(2, "0")}m
            </span>
            <span className={lowSeats ? "flex items-center gap-1 text-warning" : "flex items-center gap-1"}>
              <Users className="size-3.5" strokeWidth={1.5} />
              {availableSeatsCount} left
            </span>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold tabular-nums text-ink">
              {price.amount.toFixed(0)} <span className="text-sm font-normal text-ink-tertiary">{price.currency}</span>
            </div>
          </div>
        </div>
      </CardInteractive>
    </Link>
  );
}
