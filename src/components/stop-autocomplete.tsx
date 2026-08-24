"use client";

import { useEffect, useRef, useState } from "react";
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
      <label className="text-xs font-medium text-ink-tertiary">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary" />
        <input
          value={open ? query : (value ? `${value.city} · ${value.name}` : "")}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          placeholder={placeholder ?? "City or station"}
          className="h-12 w-full rounded-md border border-border bg-surface-sunken pl-9 pr-3 text-md text-ink placeholder:text-ink-tertiary transition-colors duration-150 hover:border-border-hover focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {open && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-md border border-border bg-surface-raised shadow-panel animate-fade-up">
          {isFetching && <div className="px-3 py-3 text-sm text-ink-tertiary">Searching…</div>}
          {!isFetching && results?.length === 0 && (
            <div className="px-3 py-3 text-sm text-ink-tertiary">No stations match &ldquo;{query}&rdquo;</div>
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
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
            >
              {stop.is_airport ? (
                <PlaneTakeoff className="size-4 shrink-0 text-ink-tertiary" strokeWidth={1.5} />
              ) : (
                <MapPin className="size-4 shrink-0 text-ink-tertiary" strokeWidth={1.5} />
              )}
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm text-ink">{stop.city}</span>
                <span className="block truncate text-xs text-ink-tertiary">{stop.name}</span>
              </span>
              {stop.station_code && (
                <span className="font-mono text-xs text-ink-tertiary">{stop.station_code}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
