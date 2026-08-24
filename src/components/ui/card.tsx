import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border border-border bg-white shadow-subtle transition-colors duration-150", className)}
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
        "group rounded-lg border border-border bg-white shadow-subtle transition-all duration-150 ease-snap",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel",
        "cursor-pointer",
        className
      )}
      {...props}
    />
  )
);
CardInteractive.displayName = "CardInteractive";
