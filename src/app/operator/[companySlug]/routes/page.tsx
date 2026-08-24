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
      <h1 className="text-lg font-bold tracking-tight text-white">Routes &amp; pricing</h1>
      <p className="mt-1 text-[13px] text-ink-onDarkSecondary">Every stop graph you operate, and the segment price matrix behind it.</p>

      {isLoading && (
        <div className="mt-6 flex flex-col gap-px">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse border border-border-dark bg-surface-dark" />
          ))}
        </div>
      )}

      {routes?.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 border border-border-dark py-16 text-center">
          <GitBranch className="size-8 text-ink-onDarkSecondary" strokeWidth={1.25} />
          <div className="text-md font-medium text-white">No routes yet</div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-px">
        {routes?.map((route) => (
          <Link
            key={route.id}
            href={`/operator/${companySlug}/routes/${route.id}`}
            className="group flex items-center justify-between border border-border-dark p-5 transition-colors hover:bg-white/[0.03]"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-md font-bold text-white">{route.name}</span>
                {!route.isActive && <Badge variant="on-dark">Inactive</Badge>}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-onDarkSecondary">
                {route.firstStopCity} <ArrowRight className="size-3" strokeWidth={2} /> {route.lastStopCity}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-ink-onDarkSecondary">
                <span>{route.stopCount} stops</span>
                {route.distanceKm && <span>{route.distanceKm.toFixed(0)} km</span>}
                <span>
                  {route.upcomingTripCount} upcoming {route.upcomingTripCount === 1 ? "trip" : "trips"}
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-ink-onDarkSecondary transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
          </Link>
        ))}
      </div>
    </main>
  );
}
