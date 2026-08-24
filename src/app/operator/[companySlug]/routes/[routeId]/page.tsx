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
        className="mb-4 flex w-fit items-center gap-1 text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-3.5" strokeWidth={2.25} />
        All routes
      </Link>

      {isLoading && <div className="h-64 animate-pulse rounded-lg border border-border bg-white" />}

      {route && (
        <>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-ink">{route.name}</h1>
            {!route.isActive && <Badge variant="neutral">Inactive</Badge>}
          </div>
          {route.distanceKm && <p className="mt-1 text-sm text-ink-secondary">{route.distanceKm.toFixed(0)} km end to end</p>}

          <div className="mt-6 rounded-lg border border-border bg-white p-5 shadow-subtle">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-tertiary">Stop graph</h2>
            <RouteStopsStrip stops={route.stops} />
          </div>

          <div className="mt-8">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-tertiary">Segment pricing matrix</h2>
            <p className="mb-3 text-sm text-ink-secondary">
              Standard fare, per origin/destination pair. Click any cell to set or change its price — it takes effect
              immediately for new searches.
            </p>
            <PricingMatrixEditor companySlug={companySlug} routeId={route.id} stops={route.stops} cells={route.pricingCells} />
          </div>
        </>
      )}
    </main>
  );
}
