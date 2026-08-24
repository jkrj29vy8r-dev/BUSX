"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { AlertTriangle, Camera, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useBoardingScan } from "@/hooks/use-operator";
import type { BoardingScanResult, TripId } from "@/types/database";

const REASON_LABEL: Record<string, string> = {
  bad_signature: "Signature invalid — not a real BUSX ticket",
  malformed: "Unreadable code",
  unknown_key_version: "Signed with an unrecognized key",
  wrong_trip: "Wrong bus — ticket is for a different trip",
  not_found: "Ticket not found",
  not_boardable: "Ticket cancelled, refunded, or expired",
};

type FlashState = { tone: "green" | "red"; headline: string; detail?: string } | null;

const RESCAN_DELAY_MS = 2200;
const SCAN_THROTTLE_MS = 400; // avoid re-decoding + re-submitting the same frame repeatedly

interface QrScannerProps {
  companySlug: string;
  tripId: TripId;
}

/**
 * Full-screen, high-contrast scanner. Camera frames are decoded locally
 * with jsQR (no round-trip needed just to read the code); the decoded
 * string is then POSTed to the trip-scoped verify endpoint, which is the
 * part that actually matters cryptographically — jsQR only extracts text
 * from pixels, it proves nothing about the ticket's HMAC signature.
 */
export function QrScanner({ companySlug, tripId }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const pausedRef = useRef(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashState>(null);
  const scan = useBoardingScan(companySlug, tripId);

  const buildFlash = useCallback((result: BoardingScanResult): FlashState => {
    if (!result.valid) {
      return { tone: "red", headline: "Reject", detail: REASON_LABEL[result.reason] ?? result.reason };
    }
    if (result.alreadyCheckedIn) {
      return { tone: "red", headline: "Already boarded", detail: `Seat ${result.ticket.seatNumber} · ${result.ticket.passengerName}` };
    }
    return {
      tone: "green",
      headline: `Seat ${result.ticket.seatNumber}`,
      detail: `${result.ticket.passengerName} · ${result.ticket.originCity} → ${result.ticket.destinationCity}`,
    };
  }, []);

  const handleDecoded = useCallback(
    (value: string) => {
      const now = Date.now();
      if (pausedRef.current) return;
      if (value === lastScanRef.current.value && now - lastScanRef.current.at < SCAN_THROTTLE_MS * 6) return;
      lastScanRef.current = { value, at: now };
      pausedRef.current = true;

      scan.mutate(value, {
        onSuccess: (result) => {
          setFlash(buildFlash(result));
          setTimeout(() => {
            setFlash(null);
            pausedRef.current = false;
          }, RESCAN_DELAY_MS);
        },
        onError: () => {
          setFlash({ tone: "red", headline: "Scan failed", detail: "Network error — try again" });
          setTimeout(() => {
            setFlash(null);
            pausedRef.current = false;
          }, RESCAN_DELAY_MS);
        },
      });
    },
    [scan, buildFlash]
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        tick();
      } catch {
        setCameraError("Camera access denied or unavailable. Grant camera permission and reload.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
          if (code?.data) handleDecoded(code.data);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [handleDecoded]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-black">
      <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-8 text-center">
          <Camera className="size-10 text-ink-onDarkSecondary" strokeWidth={1.25} />
          <p className="text-sm text-ink-onDarkSecondary">{cameraError}</p>
        </div>
      )}

      {/* Scan frame */}
      {!cameraError && !flash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative size-64">
            {(["top-0 left-0 border-t-4 border-l-4", "top-0 right-0 border-t-4 border-r-4", "bottom-0 left-0 border-b-4 border-l-4", "bottom-0 right-0 border-b-4 border-r-4"] as const).map(
              (pos) => (
                <span key={pos} className={cn("absolute size-10 border-white/80", pos)} />
              )
            )}
          </div>
        </div>
      )}

      {/* Full-screen result flash */}
      {flash && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center",
            flash.tone === "green" ? "bg-emerald" : "bg-danger"
          )}
        >
          {flash.tone === "green" ? (
            <CheckCircle2 className="size-24 text-white" strokeWidth={1.5} />
          ) : (
            <XCircle className="size-24 text-white" strokeWidth={1.5} />
          )}
          <div className="text-2xl font-extrabold text-white">{flash.headline}</div>
          {flash.detail && <div className="text-sm font-medium text-white/90">{flash.detail}</div>}
        </div>
      )}

      {scan.isPending && !flash && (
        <div className="absolute inset-x-0 top-4 flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white">
            <Sparkles className="size-3 animate-pulse" strokeWidth={2} />
            Verifying…
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white/80">
          <AlertTriangle className="size-3" strokeWidth={2} />
          Point the camera at the passenger&apos;s ticket QR
        </span>
      </div>
    </div>
  );
}
