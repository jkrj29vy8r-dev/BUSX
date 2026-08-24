import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, trailing, ...props }, ref) => (
    <div className="relative flex items-center">
      {icon && <span className="pointer-events-none absolute left-3 text-ink-tertiary">{icon}</span>}
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-surface-sunken px-3 text-sm text-ink placeholder:text-ink-tertiary",
          "transition-colors duration-150 hover:border-border-hover",
          "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
          icon && "pl-9",
          trailing && "pr-9",
          className
        )}
        {...props}
      />
      {trailing && <span className="absolute right-3 text-ink-tertiary">{trailing}</span>}
    </div>
  )
);
Input.displayName = "Input";
