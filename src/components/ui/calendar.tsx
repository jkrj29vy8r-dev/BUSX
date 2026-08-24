"use client";

import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-3",
        caption: "flex items-center justify-between px-1",
        caption_label: "text-sm font-bold text-ink",
        nav: "flex items-center gap-1",
        nav_button:
          "flex size-7 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-ink/[0.06] hover:text-ink disabled:opacity-30",
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "w-9 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary",
        row: "flex w-full",
        cell: "relative flex size-9 items-center justify-center p-0 text-center text-sm",
        day: "flex size-9 items-center justify-center rounded-md font-medium tabular-nums text-ink transition-colors hover:bg-electric-muted disabled:pointer-events-none disabled:text-ink-tertiary/40",
        day_selected: "bg-electric text-white hover:bg-electric-hover",
        day_today: "font-bold text-electric",
        day_outside: "text-ink-tertiary/50",
        day_disabled: "text-ink-tertiary/30 line-through",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="size-4" strokeWidth={2} />,
        IconRight: () => <ChevronRight className="size-4" strokeWidth={2} />,
      }}
      {...props}
    />
  );
}
