"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface BentoTileProps {
  className?: string;
  children: ReactNode;
  glow?: boolean;
  delay?: number;
}

export function BentoTile({ className, children, glow, delay = 0 }: BentoTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-white p-6 shadow-subtle",
        "transition-colors duration-200 hover:border-border-strong",
        className
      )}
    >
      {glow && <div className="pointer-events-none absolute inset-0 bg-grid-fade" />}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
