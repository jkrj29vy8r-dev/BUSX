"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/** Renders a real, scannable QR code client-side (the `qrcode` package —
 * pure local generation, no network call). High-contrast black-on-white by
 * design: that's what scanners actually need, not brand colors. */
export function QrCode({ value, size = 176, className }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0B0F17", light: "#FFFFFF" },
    }).catch(() => {
      // Malformed value (shouldn't happen — value is server-issued) —
      // leave the canvas blank rather than crash the pass.
    });
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className={cn("rounded", className)} />;
}
