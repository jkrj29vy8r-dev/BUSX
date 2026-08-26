"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useHomeSearchStore } from "@/store/home-search-store";
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

async function resolveStop(q: string): Promise<StopRow | null> {
  const res = await fetch(`/api/stops/search?q=${encodeURIComponent(q)}`);
  const body = (await res.json()) as ApiResult<StopRow[]>;
  if (!body.ok) return null;
  return body.data[0] ?? null;
}

/**
 * One-tap shortcuts for the routes BUSX actually sells most — each chip
 * resolves both cities against the real /api/stops/search (the same
 * endpoint the autocomplete uses), so a route that isn't seeded on a given
 * environment fails honestly in the chip itself. On success it fills the
 * search dock's origin/destination fields (via the shared home-search
 * store) rather than jumping straight to results, so the traveler still
 * confirms the date/passenger count before searching.
 */
export function RouteChips({ className }: { className?: string }) {
  const requestRoute = useHomeSearchStore((s) => s.requestRoute);
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
      requestRoute(origin, destination);
    } catch {
      // Same honest "unavailable" state as a not-found stop — a network or
      // API failure shouldn't surface as an uncaught console error.
      setErrorIndex(index);
      setTimeout(() => setErrorIndex((cur) => (cur === index ? null : cur)), 2400);
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
