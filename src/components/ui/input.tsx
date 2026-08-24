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
          "h-10 w-full rounded border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-tertiary",
          "transition-colors duration-150 hover:border-border-hover",
          "focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric-muted",
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

/** Floating-label field: label sits inside the control at rest and rises
 * on focus/fill — the "floating input fields" the search hero calls for. */
export const FloatingInput = forwardRef<HTMLInputElement, InputProps & { label: string }>(
  ({ className, icon, label, value, id, ...props }, ref) => {
    const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();
    return (
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          value={value}
          placeholder=" "
          className={cn(
            "peer h-14 w-full rounded-md border border-border bg-white px-3.5 pt-4 text-md text-ink outline-none",
            "transition-colors duration-150 hover:border-border-hover",
            "focus:border-electric focus:ring-2 focus:ring-electric-muted",
            icon && "pl-10",
            className
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-3.5 top-4 text-md text-ink-tertiary transition-all duration-150 ease-snap",
            "peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-electric",
            "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:text-ink-tertiary",
            icon && "left-10"
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";
