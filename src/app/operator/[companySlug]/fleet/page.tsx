"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOperatorFleet } from "@/hooks/use-operator";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-labels";

export default function OperatorFleetPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { data: fleet, isLoading } = useOperatorFleet(companySlug);

  return (
    <main className="flex-1 px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">Fleet</h1>
          <p className="mt-1 text-[13px] text-ink-onDarkSecondary">Every vehicle and the seat layout it boards passengers with.</p>
        </div>
        <Button variant="electric" asChild size="sm">
          <Link href={`/operator/${companySlug}/fleet/new`}>
            <Plus className="size-3.5" strokeWidth={2.5} />
            Build a vehicle
          </Link>
        </Button>
      </div>

      {isLoading && <div className="mt-6 h-48 animate-pulse border border-border-dark bg-surface-dark" />}

      {fleet?.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 border border-border-dark py-16 text-center">
          <Truck className="size-8 text-ink-onDarkSecondary" strokeWidth={1.25} />
          <div className="text-md font-medium text-white">No vehicles yet</div>
          <Button variant="electric" asChild size="sm" className="mt-2">
            <Link href={`/operator/${companySlug}/fleet/new`}>Build your first vehicle</Link>
          </Button>
        </div>
      )}

      {fleet && fleet.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
          {fleet.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/operator/${companySlug}/fleet/${vehicle.id}`}
              className="border border-border-dark p-5 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-white">{vehicle.registrationPlate}</span>
                {!vehicle.isActive && <Badge variant="on-dark">Inactive</Badge>}
              </div>
              <div className="mt-2 text-xs text-ink-onDarkSecondary">{VEHICLE_TYPE_LABELS[vehicle.vehicleType]}</div>
              <div className="mt-3 flex items-center gap-4 text-xs text-ink-onDarkSecondary">
                <span className="font-mono text-white">{vehicle.totalSeats}</span> seats
                <span>
                  <span className="font-mono text-white">{vehicle.upcomingTripCount}</span> upcoming trips
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
