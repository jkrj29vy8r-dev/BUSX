"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ApiResult, StopRow } from "@/types/database";

interface QuickRoute {
  fromLabel: string;
  toLabel: string;
  fromQuery: string;
  toQuery: string;
}

const ROUTES: QuickRoute[] = [
  { fromLabel: "Piatra Neamț", toLabel: "Otopeni Airport", fromQuery: "Piatra Neamț", toQuery: "Otopeni" },
  { fromLabel: "Roman", toLabel: "Iași", fromQuery: "Roman", toQuery: "Iași" },
  { fromLabel: "Bacău", toLabel: "București", fromQuery: "Bacău", toQuery: "București" },
];

function todayISODate(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

async function resolveStop(q: string): Promise<StopRow | null> {
  const res = await fetch(`/api/stops/search?q=${encodeURIComponent(q)}`);
  const body = (await res.json()) as ApiResult<StopRow[]>;
  if (!body.ok) return null;
  return body.data[0] ?? null;
}

/**
 * One-tap shortcuts for the routes BUSX actually sells most — each chip
 * resolves both cities against the real /api/stops/search (the same
 * endpoint the autocomplete uses) before navigating, so a route that isn't
 * seeded on a given environment fails honestly in the chip itself instead
 * of landing on a silently-empty results page.
 */
export function RouteChips({ className }: { className?: string }) {
  const router = useRouter();
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);

  async function handleSelect(route: QuickRoute, index: number) {
    if (pendingIndex !== null) return;
    setPendingIndex(index);
    setErrorIndex(null);

    try {
      const [origin, destination] = await Promise.all([resolveStop(route.fromQuery), resolveStop(route.toQuery)]);
      if (!origin || !destination) {
        setErrorIndex(index);
        setTimeout(() => setErrorIndex((cur) => (cur === index ? null : cur)), 2400);
        return;
      }
      const params = new URLSearchParams({
        originStopId: origin.id,
        destinationStopId: destination.id,
        originLabel: origin.city,
        destinationLabel: destination.city,
        date: todayISODate(),
        passengers: "1",
      });
      router.push(`/search?${params.toString()}`);
    } finally {
      setPendingIndex((cur) => (cur === index ? null : cur));
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {ROUTES.map((route, i) => {
        const isPending = pendingIndex === i;
        const isError = errorIndex === i;
        return (
          <motion.button
            key={route.fromLabel + route.toLabel}
            type="button"
            onClick={() => handleSelect(route, i)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
              isError
                ? "border-danger/30 bg-danger/[0.06] text-danger"
                : "border-slate-200 bg-slate-50 text-ink-secondary hover:border-electric hover:bg-electric-muted hover:text-electric"
            )}
          >
            {isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : isError ? (
              <AlertTriangle className="size-3" strokeWidth={2} />
            ) : (
              <span className="size-1.5 rounded-full bg-emerald" />
            )}
            {isError ? (
              "Rută indisponibilă momentan"
            ) : (
              <>
                {route.fromLabel}
                <ArrowRight className="size-3" strokeWidth={2} />
                {route.toLabel}
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
