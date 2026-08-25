"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RouteStopsStrip } from "@/components/operator/route-stops-strip";
import { PricingMatrixEditor } from "@/components/operator/pricing-matrix-editor";
import { useOperatorRouteDetail } from "@/hooks/use-operator";

export default function OperatorRouteDetailPage() {
  const { companySlug, routeId } = useParams<{ companySlug: string; routeId: string }>();
  const { data: route, isLoading } = useOperatorRouteDetail(companySlug, routeId as never);

  return (
    <main className="flex-1 px-8 py-8">
      <Link
        href={`/operator/${companySlug}/routes`}
        className="mb-4 flex w-fit items-center gap-1 text-xs font-semibold text-ink-onDarkSecondary transition-colors hover:text-white"
      >
        <ChevronLeft className="size-3.5" strokeWidth={2.25} />
        Toate rutele
      </Link>

      {isLoading && <div className="h-64 animate-pulse border border-border-dark bg-surface-dark" />}

      {route && (
        <>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white">{route.name}</h1>
            {!route.isActive && <Badge variant="on-dark">Inactivă</Badge>}
          </div>
          {route.distanceKm && <p className="mt-1 text-sm text-ink-onDarkSecondary">{route.distanceKm.toFixed(0)} km capăt la capăt</p>}

          <div className="mt-6 border border-border-dark p-5">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">Traseul stațiilor</h2>
            <RouteStopsStrip stops={route.stops} />
          </div>

          <div className="mt-8">
            <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">Matricea de tarife pe segmente</h2>
            <p className="mb-3 text-sm text-ink-onDarkSecondary">
              Tarif standard, pentru fiecare pereche origine/destinație. Apasă pe orice celulă pentru a seta sau
              schimba prețul — se aplică imediat pentru căutările noi.
            </p>
            <PricingMatrixEditor companySlug={companySlug} routeId={route.id} stops={route.stops} cells={route.pricingCells} />
          </div>
        </>
      )}
    </main>
  );
}
