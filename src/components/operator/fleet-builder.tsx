"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Armchair,
  Check,
  DoorOpen,
  Eraser,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  SquareUser,
  Bath,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useSaveOperatorVehicle } from "@/hooks/use-operator";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-labels";
import type { OperatorVehicleDetail, SeatLayout, SeatTypeEnum, VehicleId, VehicleTypeEnum } from "@/types/database";

type CellTool = "empty" | "standard" | "premium" | "driver" | "door" | "toilet";

const TOOLS: Array<{ id: CellTool; label: string; icon: typeof Armchair; swatch: string }> = [
  { id: "standard", label: "Loc standard", icon: Armchair, swatch: "border-white/25 bg-white/[0.06] text-white" },
  { id: "premium", label: "Loc VIP", icon: Sparkles, swatch: "border-gold bg-gold/10 text-gold" },
  { id: "driver", label: "Șofer", icon: SquareUser, swatch: "border-[#6FA6FF] bg-electric/10 text-[#6FA6FF]" },
  { id: "door", label: "Ușă", icon: DoorOpen, swatch: "border-emerald bg-emerald/10 text-emerald" },
  { id: "toilet", label: "Toaletă", icon: Bath, swatch: "border-white/25 bg-white/[0.06] text-ink-onDarkSecondary" },
  { id: "empty", label: "Radieră", icon: Eraser, swatch: "border-dashed border-white/20 bg-transparent text-ink-onDarkSecondary" },
];

const VEHICLE_TYPES: VehicleTypeEnum[] = ["minibus_16", "sprinter_19", "isuzu_30", "coach_50", "double_decker_70", "custom"];

function emptyGrid(rows: number, cols: number): CellTool[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => "empty" as CellTool));
}

function gridFromVehicle(vehicle: OperatorVehicleDetail | undefined): { grid: CellTool[][]; aisleAfterCol: number; fullWidthRows: Set<number> } {
  if (!vehicle) return { grid: emptyGrid(10, 4), aisleAfterCol: 1, fullWidthRows: new Set() };
  const { rows, cols } = vehicle.seatLayout;
  const grid = emptyGrid(rows, cols);
  for (const seat of vehicle.seats) {
    if (seat.rowNumber < rows && seat.colPosition < cols) {
      grid[seat.rowNumber]![seat.colPosition] = seat.seatType === "driver" ? "driver" : seat.seatType === "premium" ? "premium" : "standard";
    }
  }
  for (const marker of vehicle.seatLayout.layoutMarkers ?? []) {
    if (marker.row < rows && marker.col < cols) grid[marker.row]![marker.col] = marker.kind;
  }
  return { grid, aisleAfterCol: vehicle.seatLayout.aisleAfterCol, fullWidthRows: new Set(vehicle.seatLayout.fullWidthRows ?? []) };
}

interface FleetBuilderProps {
  companySlug: string;
  vehicle?: OperatorVehicleDetail;
}

/**
 * The drag-and-drop bus layout builder. Palette tools are draggable
 * (native HTML5 DnD) onto grid cells; every tool is also click-to-paint,
 * since touch devices don't do HTML5 drag reliably and an operator
 * filling a 50-seat coach one drag at a time is a bad afternoon. Saving
 * turns the grid into the exact `seat_layout` JSON + `seats` rows the
 * passenger-facing SeatPicker and the booking engine already consume —
 * this is the same schema, not a preview of one.
 */
export function FleetBuilder({ companySlug, vehicle }: FleetBuilderProps) {
  const router = useRouter();
  const initial = useMemo(() => gridFromVehicle(vehicle), [vehicle]);

  const [registrationPlate, setRegistrationPlate] = useState(vehicle?.registrationPlate ?? "");
  const [vehicleType, setVehicleType] = useState<VehicleTypeEnum>(vehicle?.vehicleType ?? "sprinter_19");
  const [rows, setRows] = useState(initial.grid.length);
  const [cols, setCols] = useState(initial.grid[0]?.length ?? 4);
  const [aisleAfterCol, setAisleAfterCol] = useState(initial.aisleAfterCol);
  const [fullWidthRows, setFullWidthRows] = useState<Set<number>>(initial.fullWidthRows);
  const [grid, setGrid] = useState<CellTool[][]>(initial.grid);
  const [activeTool, setActiveTool] = useState<CellTool>("standard");
  const [dragTool, setDragTool] = useState<CellTool | null>(null);

  const mutation = useSaveOperatorVehicle(companySlug);

  function resize(newRows: number, newCols: number) {
    const next = emptyGrid(newRows, newCols);
    for (let r = 0; r < Math.min(newRows, grid.length); r++) {
      for (let c = 0; c < Math.min(newCols, grid[r]?.length ?? 0); c++) {
        next[r]![c] = grid[r]![c]!;
      }
    }
    setGrid(next);
    setRows(newRows);
    setCols(newCols);
  }

  function paint(r: number, c: number, tool: CellTool) {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      // A vehicle has exactly one driver seat — placing a new one clears any previous.
      if (tool === "driver") {
        for (let rr = 0; rr < next.length; rr++) {
          for (let cc = 0; cc < next[rr]!.length; cc++) {
            if (next[rr]![cc] === "driver") next[rr]![cc] = "empty";
          }
        }
      }
      next[r]![c] = tool;
      return next;
    });
  }

  function toggleFullWidthRow(r: number) {
    setFullWidthRows((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  }

  const seatCount = grid.flat().filter((c) => c === "standard" || c === "premium").length;
  const hasDriver = grid.flat().includes("driver");

  function handleSave() {
    const disabledCells: Array<[number, number]> = [];
    const layoutMarkers: SeatLayout["layoutMarkers"] = [];
    const seats: Array<{ seatNumber: string; rowNumber: number; colPosition: number; deck: number; seatType: SeatTypeEnum }> = [];
    let seatCounter = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tool = grid[r]?.[c] ?? "empty";
        if (tool === "empty") {
          disabledCells.push([r, c]);
        } else if (tool === "door" || tool === "toilet") {
          layoutMarkers!.push({ row: r, col: c, kind: tool });
        } else if (tool === "driver") {
          seats.push({ seatNumber: "DR", rowNumber: r, colPosition: c, deck: 1, seatType: "driver" });
        } else {
          seats.push({ seatNumber: String(seatCounter++), rowNumber: r, colPosition: c, deck: 1, seatType: tool === "premium" ? "premium" : "standard" });
        }
      }
    }

    const seatLayout: SeatLayout = {
      rows,
      cols,
      aisleAfterCol,
      deck: 1,
      disabledCells,
      fullWidthRows: [...fullWidthRows],
      layoutMarkers,
      layoutVersion: 1,
    };

    mutation.mutate(
      { vehicleId: (vehicle?.id ?? null) as VehicleId | null, registrationPlate, vehicleType, seatLayout, seats },
      { onSuccess: () => router.push(`/operator/${companySlug}/fleet`) }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 border border-border-dark p-5 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-onDarkSecondary">Număr de înmatriculare</span>
          <input
            value={registrationPlate}
            onChange={(e) => setRegistrationPlate(e.target.value.toUpperCase())}
            placeholder="NT-01-BUS"
            className="h-9 border border-border-dark bg-white/[0.03] px-3 font-mono text-sm text-white outline-none focus:border-electric"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-onDarkSecondary">Clasa vehiculului</span>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as VehicleTypeEnum)}
            className="h-9 border border-border-dark bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-electric"
          >
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t} className="bg-surface-dark">
                {VEHICLE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-onDarkSecondary">Locuri plasate</span>
          <div className="flex h-9 items-center font-mono text-sm text-white">{seatCount} rezervabile</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="border border-border-dark p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">Paletă</h3>
            <p className="mb-3 text-[11px] text-ink-onDarkSecondary/70">Trage pe grilă, sau selectează un instrument și apoi apasă pe celule pentru a picta.</p>
            <div className="flex flex-col gap-1.5">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    draggable
                    onDragStart={() => setDragTool(tool.id)}
                    onDragEnd={() => setDragTool(null)}
                    onClick={() => setActiveTool(tool.id)}
                    className={cn(
                      "flex cursor-grab items-center gap-2.5 border px-3 py-2 text-left text-xs font-medium transition-all active:cursor-grabbing",
                      tool.swatch,
                      activeTool === tool.id ? "ring-1 ring-white/50" : "opacity-80 hover:opacity-100"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
                    {tool.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border border-border-dark p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">Grilă</h3>
            <div className="flex flex-col gap-3 text-xs text-ink-onDarkSecondary">
              <DimensionStepper label="Rânduri" value={rows} onChange={(v) => resize(v, cols)} min={1} max={20} />
              <DimensionStepper label="Coloane" value={cols} onChange={(v) => resize(rows, v)} min={1} max={8} />
              <DimensionStepper label="Culoar după coloana" value={aisleAfterCol} onChange={setAisleAfterCol} min={0} max={cols - 1} />
            </div>
          </div>

          {!hasDriver && (
            <div className="flex items-center gap-2 border border-warning/30 bg-warning/[0.06] px-3 py-2.5 text-[11px] text-warning">
              <AlertTriangle className="size-3.5 shrink-0" strokeWidth={1.75} />
              Niciun loc de șofer plasat încă.
            </div>
          )}
        </div>

        <div className="border border-border-dark p-5">
          <div className="inline-flex flex-col gap-1.5">
            {grid.map((row, r) => (
              <div key={r} className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5">
                  {row.map((tool, c) => {
                    const isAisle = !fullWidthRows.has(r) && c === aisleAfterCol;
                    const toolMeta = TOOLS.find((t) => t.id === tool)!;
                    const Icon = toolMeta.icon;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => paint(r, c, activeTool)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragTool) paint(r, c, dragTool);
                        }}
                        className={cn(
                          "flex size-9 items-center justify-center border text-[10px] font-bold transition-colors",
                          isAisle && "mr-4",
                          tool === "empty" ? "border-dashed border-white/10 bg-transparent hover:border-white/30" : cn("border", toolMeta.swatch)
                        )}
                        title={`Rândul ${r + 1}, coloana ${c + 1} · ${toolMeta.label}`}
                      >
                        {tool !== "empty" && <Icon className="size-3.5" strokeWidth={1.75} />}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => toggleFullWidthRow(r)}
                  className={cn(
                    "ml-2 whitespace-nowrap px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors",
                    fullWidthRows.has(r) ? "bg-electric/20 text-[#6FA6FF]" : "text-ink-onDarkSecondary/50 hover:text-ink-onDarkSecondary"
                  )}
                >
                  {fullWidthRows.has(r) ? "Banchetă spate" : "+ banchetă spate"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {mutation.isError && (
        <div className="flex items-center gap-2 border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
          <AlertTriangle className="size-4 shrink-0" strokeWidth={1.75} />
          {mutation.error instanceof Error ? mutation.error.message : "Salvarea planului de locuri a eșuat"}
        </div>
      )}

      <div>
        <Button
          variant="electric"
          onClick={handleSave}
          disabled={mutation.isPending || seatCount === 0 || !registrationPlate.trim()}
        >
          {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" strokeWidth={2.5} />}
          Salvează vehiculul
        </Button>
      </div>
    </div>
  );
}

function DimensionStepper({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex size-6 items-center justify-center border border-border-dark text-ink-onDarkSecondary hover:text-white"
        >
          <Minus className="size-3" />
        </button>
        <span className="w-6 text-center font-mono text-white">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex size-6 items-center justify-center border border-border-dark text-ink-onDarkSecondary hover:text-white"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}
