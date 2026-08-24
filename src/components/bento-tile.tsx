import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface BentoTileProps {
  className?: string;
  children: ReactNode;
  glow?: boolean;
}

export function BentoTile({ className, children, glow }: BentoTileProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-surface p-6",
        "transition-colors duration-200 hover:border-border-hover",
        className
      )}
    >
      {glow && <div className="pointer-events-none absolute inset-0 bg-grid-fade" />}
      <div className="relative">{children}</div>
    </div>
  );
}
