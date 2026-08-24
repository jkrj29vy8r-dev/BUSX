"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, PlaneTakeoff, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStopSearch } from "@/hooks/use-stop-search";
import type { StopRow } from "@/types/database";

interface StopAutocompleteProps {
  label: string;
  placeholder?: string;
  value: StopRow | null;
  onChange: (stop: StopRow) => void;
  className?: string;
}

/** Omio-style origin/destination picker: type a city or station, pick from a live dropdown. */
export function StopAutocomplete({ label, placeholder, value, onChange, className }: StopAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: results, isFetching } = useStopSearch(query);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1.5", className)}>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-onDarkSecondary">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary" strokeWidth={2} />
        <input
          value={open ? query : value ? `${value.city} · ${value.name}` : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          placeholder={placeholder ?? "City or station"}
          className="h-14 w-full rounded-md border border-border bg-white pl-10 pr-3 text-md font-medium text-ink placeholder:font-normal placeholder:text-ink-tertiary transition-colors duration-150 hover:border-border-hover focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric-muted"
        />
      </div>

      <AnimatePresence>
        {open && query.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-border bg-white shadow-panel"
          >
            {isFetching && <div className="px-3.5 py-3 text-sm text-ink-tertiary">Searching…</div>}
            {!isFetching && results?.length === 0 && (
              <div className="px-3.5 py-3 text-sm text-ink-tertiary">No stations match &ldquo;{query}&rdquo;</div>
            )}
            {results?.map((stop) => (
              <button
                key={stop.id}
                type="button"
                onClick={() => {
                  onChange(stop);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-electric-muted"
              >
                {stop.is_airport ? (
                  <PlaneTakeoff className="size-4 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
                ) : (
                  <MapPin className="size-4 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{stop.city}</span>
                  <span className="block truncate text-xs text-ink-tertiary">{stop.name}</span>
                </span>
                {stop.station_code && <span className="font-mono text-xs text-ink-tertiary">{stop.station_code}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
