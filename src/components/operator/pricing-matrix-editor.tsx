"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUpdatePricingCell } from "@/hooks/use-operator";
import type { OperatorPricingCell, OperatorRouteStop, RouteId, RouteStopId } from "@/types/database";

interface PricingMatrixEditorProps {
  companySlug: string;
  routeId: RouteId;
  stops: OperatorRouteStop[];
  cells: OperatorPricingCell[];
}

function cellKey(origin: RouteStopId, destination: RouteStopId): string {
  return `${origin}:${destination}`;
}

/**
 * The direct editing surface for `segment_pricing_matrix` — an N×N grid,
 * origins down the rows and destinations across the columns, showing only
 * the cells that are actually sellable (destination strictly after origin
 * in the route graph). This is the operator-facing half of "differential
 * matrix pricing": every cell here is one real row in that table, edited
 * in place via PATCH .../pricing, not a mockup.
 */
export function PricingMatrixEditor({ companySlug, routeId, stops, cells }: PricingMatrixEditorProps) {
  const sorted = [...stops].sort((a, b) => a.orderIndex - b.orderIndex);
  const cellByKey = new Map(cells.map((c) => [cellKey(c.originRouteStopId, c.destinationRouteStopId), c]));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const mutation = useUpdatePricingCell(companySlug, routeId);

  function startEdit(cell: OperatorPricingCell) {
    setEditingKey(cellKey(cell.originRouteStopId, cell.destinationRouteStopId));
    setDraft(cell.priceAmount != null ? String(cell.priceAmount) : "");
  }

  function commit(cell: OperatorPricingCell) {
    const amount = Number(draft);
    if (!Number.isFinite(amount) || amount < 0) {
      setEditingKey(null);
      return;
    }
    mutation.mutate(
      { originRouteStopId: cell.originRouteStopId, destinationRouteStopId: cell.destinationRouteStopId, fareClass: "standard", priceAmount: amount },
      { onSettled: () => setEditingKey(null) }
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-subtle">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-r border-border bg-surface-inset px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-tertiary">
              Origin \ Destination
            </th>
            {sorted.map((dest) => (
              <th
                key={dest.routeStopId}
                className="border-b border-border px-3 py-2.5 text-left text-xs font-semibold text-ink"
              >
                {dest.city}
                <div className="font-normal text-ink-tertiary">{dest.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((origin) => (
            <tr key={origin.routeStopId}>
              <th className="sticky left-0 z-10 border-b border-r border-border bg-surface-inset px-3 py-2.5 text-left text-xs font-semibold text-ink">
                {origin.city}
                <div className="font-normal text-ink-tertiary">{origin.name}</div>
              </th>
              {sorted.map((destination) => {
                if (destination.orderIndex <= origin.orderIndex) {
                  return (
                    <td
                      key={destination.routeStopId}
                      className="border-b border-border bg-[repeating-linear-gradient(135deg,rgba(11,15,23,0.03)_0px,rgba(11,15,23,0.03)_4px,transparent_4px,transparent_9px)] px-3 py-2.5"
                    />
                  );
                }

                const cell = cellByKey.get(cellKey(origin.routeStopId, destination.routeStopId)) ?? {
                  originRouteStopId: origin.routeStopId,
                  destinationRouteStopId: destination.routeStopId,
                  priceAmount: null,
                  currency: "RON",
                };
                const key = cellKey(origin.routeStopId, destination.routeStopId);
                const isEditing = editingKey === key;
                const isSaving = mutation.isPending && mutation.variables?.originRouteStopId === origin.routeStopId && mutation.variables?.destinationRouteStopId === destination.routeStopId;

                return (
                  <td key={destination.routeStopId} className="border-b border-border px-2 py-1.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          type="number"
                          min={0}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commit(cell);
                            if (e.key === "Escape") setEditingKey(null);
                          }}
                          className="h-8 w-20 rounded border border-electric bg-white px-2 text-sm tabular-nums text-ink outline-none ring-2 ring-electric-muted"
                        />
                        <button onClick={() => commit(cell)} className="flex size-6 items-center justify-center rounded text-emerald-hover hover:bg-emerald-muted">
                          <Check className="size-3.5" strokeWidth={2.5} />
                        </button>
                        <button onClick={() => setEditingKey(null)} className="flex size-6 items-center justify-center rounded text-ink-tertiary hover:bg-ink/[0.06]">
                          <X className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(cell)}
                        className={cn(
                          "group flex h-8 w-24 items-center justify-between rounded px-2 font-mono text-sm tabular-nums transition-colors",
                          cell.priceAmount != null ? "text-ink hover:bg-electric-muted" : "text-ink-tertiary/50 hover:bg-electric-muted hover:text-electric"
                        )}
                      >
                        {isSaving ? (
                          <Loader2 className="mx-auto size-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>{cell.priceAmount != null ? `${cell.priceAmount.toFixed(0)} ${cell.currency}` : "Set price"}</span>
                            <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2} />
                          </>
                        )}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
