import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "bg-ink/[0.06] text-ink-secondary",
        electric: "bg-electric-muted text-electric",
        emerald: "bg-emerald-muted text-emerald-hover",
        gold: "bg-gold-muted text-gold",
        warning: "bg-warning-muted text-warning",
        danger: "bg-danger-muted text-danger",
        "on-dark": "bg-white/[0.10] text-ink-onDark",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
