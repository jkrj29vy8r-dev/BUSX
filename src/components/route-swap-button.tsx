"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/cn";

interface RouteSwapButtonProps {
  onSwap: () => void;
  className?: string;
}

/** The animated origin/destination swap control — a full 180° spring
 * rotation plus a tactile press-scale, not a bare hover-color-change icon. */
export function RouteSwapButton({ onSwap, className }: RouteSwapButtonProps) {
  const [spins, setSpins] = useState(0);
  const [rippleId, setRippleId] = useState<number | null>(null);

  return (
    <motion.button
      type="button"
      onClick={() => {
        setSpins((n) => n + 1);
        setRippleId(Date.now());
        onSwap();
      }}
      aria-label="Inversează originea și destinația"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-ink-secondary shadow-subtle",
        "transition-colors duration-150 hover:border-electric hover:text-electric",
        className
      )}
    >
      {rippleId !== null && (
        <motion.span
          key={rippleId}
          initial={{ scale: 0.3, opacity: 0.5 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onAnimationComplete={() => setRippleId((cur) => (cur === rippleId ? null : cur))}
          className="pointer-events-none absolute inset-0 rounded-full bg-electric/40"
        />
      )}
      <motion.span
        animate={{ rotate: spins * 180 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex"
      >
        <ArrowRightLeft className="size-4" strokeWidth={2} />
      </motion.span>
    </motion.button>
  );
}
