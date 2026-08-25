"use client";

import { Minus, Plus, Users } from "lucide-react";
import { cn } from "@/lib/cn";

interface PassengerStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function PassengerStepper({ value, onChange, min = 1, max = 9, className }: PassengerStepperProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-onDarkSecondary">Pasageri</label>
      <div className="flex h-14 items-center justify-between rounded-md border border-border bg-white px-3.5">
        <span className="flex items-center gap-2 text-md font-medium text-ink">
          <Users className="size-4 text-ink-tertiary" strokeWidth={1.75} />
          {value}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
            className="flex size-7 items-center justify-center rounded border border-border text-ink-secondary transition-colors hover:border-border-strong hover:text-ink disabled:pointer-events-none disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={value >= max}
            onClick={() => onChange(Math.min(max, value + 1))}
            className="flex size-7 items-center justify-center rounded border border-border text-ink-secondary transition-colors hover:border-border-strong hover:text-ink disabled:pointer-events-none disabled:opacity-30"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
