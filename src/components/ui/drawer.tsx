"use client";

import { type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Right-edge slide-out sheet — the "Route Itinerary Drawer" chrome. Built on
 * Radix Dialog (focus trap, ESC/overlay dismiss, scroll lock) with
 * `forceMount` so Framer Motion — not Radix's own CSS classes — owns the
 * enter/exit animation via AnimatePresence.
 */
export function Drawer({ open, onOpenChange, title, subtitle, children, className }: DrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPortal forceMount>
            <DialogOverlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </DialogOverlay>
            <DialogPrimitive.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 340, damping: 34 }}
                className={cn(
                  "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-white shadow-panel outline-none sm:rounded-l-xl",
                  className
                )}
              >
                <div className="flex items-start justify-between border-b border-border px-6 py-5">
                  <div>
                    <DialogPrimitive.Title className="text-lg font-bold tracking-tight text-ink">{title}</DialogPrimitive.Title>
                    {subtitle && <DialogPrimitive.Description className="mt-0.5 text-sm text-ink-secondary">{subtitle}</DialogPrimitive.Description>}
                  </div>
                  <DialogPrimitive.Close className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-ink/[0.06] hover:text-ink">
                    <X className="size-4" strokeWidth={1.75} />
                  </DialogPrimitive.Close>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
