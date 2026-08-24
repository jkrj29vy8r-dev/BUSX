import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "neutral" | "electric" | "emerald";
  live?: boolean;
  className?: string;
}

const toneClasses = {
  neutral: "bg-ink/[0.06] text-ink",
  electric: "bg-electric-muted text-electric",
  emerald: "bg-emerald-muted text-emerald-hover",
};

export function StatTile({ label, value, icon: Icon, tone = "neutral", live, className }: StatTileProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-white p-5 shadow-subtle", className)}>
      <div className="flex items-center justify-between">
        <div className={cn("flex size-8 items-center justify-center rounded-md", toneClasses[tone])}>
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
        {live && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-hover">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-emerald" />
            Live
          </span>
        )}
      </div>
      <div className="mt-3 font-mono text-2xl font-bold tabular-nums text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-ink-tertiary">{label}</div>
    </div>
  );
}
