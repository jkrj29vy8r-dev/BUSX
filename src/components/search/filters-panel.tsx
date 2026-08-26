import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DEPARTURE_BUCKET_LABELS,
  DEPARTURE_BUCKET_RANGES,
  SORT_LABELS,
  type DepartureBucket,
  type OperatorOption,
  type SortKey,
  type TripFiltersState,
} from "@/lib/trip-filters";

const DEPARTURE_BUCKETS: DepartureBucket[] = ["morning", "midday", "evening"];
const SORT_KEYS: SortKey[] = ["departure", "price", "duration"];

interface FiltersPanelProps {
  filters: TripFiltersState;
  onChange: (filters: TripFiltersState) => void;
  operators: OperatorOption[];
  className?: string;
}

/** Shared filter/sort controls — rendered as-is in the desktop sidebar, and
 * inside a `Drawer` on mobile. All state lives in the parent (the results
 * page), so both surfaces stay in sync automatically. */
export function FiltersPanel({ filters, onChange, operators, className }: FiltersPanelProps) {
  function toggleBucket(bucket: DepartureBucket) {
    const next = new Set(filters.buckets);
    if (next.has(bucket)) next.delete(bucket);
    else next.add(bucket);
    onChange({ ...filters, buckets: next });
  }

  function toggleOperator(id: string) {
    const next = new Set(filters.companyIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...filters, companyIds: next });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div>
        <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Sortează după</div>
        <div className="flex flex-col gap-1">
          {SORT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...filters, sort: key })}
              className={cn(
                "flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors",
                filters.sort === key ? "bg-electric-muted text-electric" : "text-ink-secondary hover:bg-ink/[0.04] hover:text-ink"
              )}
            >
              {SORT_LABELS[key]}
              {filters.sort === key && <Check className="size-3.5" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Ora plecării</div>
        <div className="flex flex-col gap-1">
          {DEPARTURE_BUCKETS.map((bucket) => {
            const checked = filters.buckets.has(bucket);
            return (
              <label
                key={bucket}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  checked ? "bg-electric-muted" : "hover:bg-ink/[0.04]"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleBucket(bucket)}
                  className="size-4 rounded border-slate-300 text-electric accent-electric focus:ring-electric-muted"
                />
                <span className={cn("font-medium", checked ? "text-electric" : "text-ink")}>{DEPARTURE_BUCKET_LABELS[bucket]}</span>
                <span className="ml-auto text-xs text-ink-tertiary">{DEPARTURE_BUCKET_RANGES[bucket]}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Operator</div>
        {operators.length === 0 && <p className="text-sm text-ink-tertiary">Niciun operator disponibil pentru această căutare.</p>}
        <div className="flex flex-col gap-1">
          {operators.map((op) => {
            const checked = filters.companyIds.has(op.id);
            return (
              <label
                key={op.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  checked ? "bg-electric-muted" : "hover:bg-ink/[0.04]"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOperator(op.id)}
                  className="size-4 rounded border-slate-300 text-electric accent-electric focus:ring-electric-muted"
                />
                <span className={cn("min-w-0 flex-1 truncate font-medium", checked ? "text-electric" : "text-ink")}>{op.name}</span>
                <span className="text-xs text-ink-tertiary">{op.count}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
