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
  neutral: "text-ink-onDarkSecondary",
  electric: "text-[#6FA6FF]",
  emerald: "text-emerald",
};

export function StatTile({ label, value, icon: Icon, tone = "neutral", live, className }: StatTileProps) {
  return (
    <div className={cn("border border-border-dark p-4", className)}>
      <div className="flex items-center justify-between">
        <Icon className={cn("size-3.5", toneClasses[tone])} strokeWidth={1.75} />
        {live && (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-emerald">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-emerald" />
            Live acum
          </span>
        )}
      </div>
      <div className="mt-3 font-mono text-2xl font-bold tabular-nums text-white">{value}</div>
      <div className="mt-0.5 text-[11px] text-ink-onDarkSecondary">{label}</div>
    </div>
  );
}
