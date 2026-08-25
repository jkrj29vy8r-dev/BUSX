"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded font-semibold transition-colors duration-150 ease-snap disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-ink text-white hover:bg-ink/90 shadow-crisp",
        electric: "bg-electric text-white hover:bg-electric-hover shadow-[0_1px_0_rgba(255,255,255,0.25)_inset]",
        secondary: "bg-white text-ink border border-border hover:border-border-strong hover:bg-canvas shadow-subtle",
        ghost: "text-ink-secondary hover:text-ink hover:bg-ink/[0.05]",
        "ghost-dark": "text-ink-onDarkSecondary hover:text-ink-onDark hover:bg-white/[0.08]",
        danger: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-9 px-3.5 text-sm",
        lg: "h-12 px-5 text-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, asChild, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <motion.button
        ref={ref}
        whileTap={disabled || loading ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.12 }}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading && <Loader2 className="size-3.5 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
