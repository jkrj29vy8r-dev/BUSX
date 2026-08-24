import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-surface transition-colors duration-150",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardInteractive = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group rounded-lg border border-border bg-surface transition-all duration-150 ease-snap",
        "hover:border-border-hover hover:bg-surface-raised hover:shadow-panel",
        "cursor-pointer",
        className
      )}
      {...props}
    />
  )
);
CardInteractive.displayName = "CardInteractive";
