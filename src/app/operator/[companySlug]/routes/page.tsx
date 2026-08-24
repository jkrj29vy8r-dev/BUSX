"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronRight, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOperatorRoutes } from "@/hooks/use-operator";

export default function OperatorRoutesPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { data: routes, isLoading } = useOperatorRoutes(companySlug);

  return (
    <main className="flex-1 px-8 py-8">
      <h1 className="text-xl font-extrabold tracking-tight text-ink">Routes &amp; pricing</h1>
      <p className="mt-1 text-sm text-ink-secondary">Every stop graph you operate, and the segment price matrix behind it.</p>

      {isLoading && (
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-white" />
          ))}
        </div>
      )}

      {routes?.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-border bg-white py-16 text-center">
          <GitBranch className="size-8 text-ink-tertiary" strokeWidth={1.25} />
          <div className="text-md font-medium text-ink">No routes yet</div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {routes?.map((route) => (
          <Link
            key={route.id}
            href={`/operator/${companySlug}/routes/${route.id}`}
            className="group flex items-center justify-between rounded-lg border border-border bg-white p-5 shadow-subtle transition-all duration-150 ease-snap hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-md font-bold text-ink">{route.name}</span>
                {!route.isActive && <Badge variant="neutral">Inactive</Badge>}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-secondary">
                {route.firstStopCity} <ArrowRight className="size-3" strokeWidth={2} /> {route.lastStopCity}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-ink-tertiary">
                <span>{route.stopCount} stops</span>
                {route.distanceKm && <span>{route.distanceKm.toFixed(0)} km</span>}
                <span>
                  {route.upcomingTripCount} upcoming {route.upcomingTripCount === 1 ? "trip" : "trips"}
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-ink-tertiary transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
          </Link>
        ))}
      </div>
    </main>
  );
}
