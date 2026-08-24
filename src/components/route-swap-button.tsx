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

  return (
    <motion.button
      type="button"
      onClick={() => {
        setSpins((n) => n + 1);
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
