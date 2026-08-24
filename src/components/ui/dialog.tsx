"use client";

import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

// forwardRef is required here, not cosmetic: with `asChild`, Radix's Slot
// clones this element and attaches its own ref for pointer/focus handling —
// a plain function component can't accept that ref.
export const DialogOverlay = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentProps<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]", className)} {...props} />
));
DialogOverlay.displayName = "DialogOverlay";
