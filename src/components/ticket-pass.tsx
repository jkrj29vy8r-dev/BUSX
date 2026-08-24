"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Sparkles, Wallet } from "lucide-react";
import { QrCode } from "@/components/qr-code";
import { MapPinPreview } from "@/components/map-pin-preview";
import { Button } from "@/components/ui/button";
import { buildQrString } from "@/lib/qr/build-qr-string";
import { getTicketLiveStatus, type LiveStatusTone } from "@/lib/ticket-status";
import { cn } from "@/lib/cn";
import type { IssuedTicket, TripStatus } from "@/types/database";

interface TicketPassProps {
  ticket: IssuedTicket;
  companyName: string;
  companyColor: string;
  routeName: string;
  originCity: string;
  destinationCity: string;
  departureAtISO: string;
  tripStatus: TripStatus;
  stopsForMap?: Array<{ name: string; latitude: number; longitude: number }>;
  className?: string;
}

const toneClasses: Record<LiveStatusTone, string> = {
  neutral: "bg-white/10 text-ink-onDarkSecondary",
  emerald: "bg-emerald/15 text-emerald",
  electric: "bg-electric/20 text-[#6FA6FF]",
  danger: "bg-danger/20 text-[#FF8B8E]",
};

const toneDot: Record<LiveStatusTone, string> = {
  neutral: "bg-ink-onDarkSecondary",
  emerald: "bg-emerald",
  electric: "bg-[#6FA6FF]",
  danger: "bg-[#FF8B8E]",
};

/**
 * PassKit-style wallet pass. "Add to Wallet" is presented honestly: real
 * Apple/Google Wallet passes require an operator-signed .pkpass/.json
 * bundle from a paid Apple Developer certificate this environment doesn't
 * hold, so the button surfaces that instead of pretending to generate one.
 * "Download PDF" is fully real — it prints just this card via the
 * `[data-print-active]` rule in globals.css (browser "Save as PDF").
 */
export function TicketPass({
  ticket,
  companyName,
  companyColor,
  routeName,
  originCity,
  destinationCity,
  departureAtISO,
  tripStatus,
  stopsForMap,
  className,
}: TicketPassProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [walletNoticeOpen, setWalletNoticeOpen] = useState(false);
  const [status, setStatus] = useState(() =>
    getTicketLiveStatus({ departureAtISO, ticketStatus: ticket.status, tripStatus })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getTicketLiveStatus({ departureAtISO, ticketStatus: ticket.status, tripStatus }));
    }, 30_000);
    return () => clearInterval(interval);
  }, [departureAtISO, ticket.status, tripStatus]);

  const qrValue = buildQrString(ticket.qr_payload, ticket.hmac_signature);
  const isVip = ticket.fare_class === "premium";

  function handleDownloadPdf() {
    const node = rootRef.current;
    if (!node) return;
    node.setAttribute("data-print-active", "true");
    const cleanup = () => node.removeAttribute("data-print-active");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    // Safari doesn't reliably fire afterprint in all contexts — belt & suspenders.
    setTimeout(cleanup, 2000);
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-xl border border-border-dark bg-surface-dark texture-noise text-ink-onDark shadow-panel-dark",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-dark-grid-fade" />

      <div className="relative flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded text-xs font-bold text-white" style={{ backgroundColor: companyColor }}>
            {companyName.slice(0, 1)}
          </span>
          <div>
            <div className="text-sm font-bold leading-none">{companyName}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-onDarkSecondary">BUSX Pass</div>
          </div>
        </div>
        {isVip && (
          <span className="flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
            <Sparkles className="size-2.5" strokeWidth={2.5} fill="currentColor" />
            VIP
          </span>
        )}
      </div>

      <div className="relative px-5 pt-4">
        <div className="text-xs text-ink-onDarkSecondary">{routeName}</div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">{originCity}</div>
          </div>
          <div className="mb-1 flex-1 px-3">
            <div className="h-px w-full border-t border-dashed border-white/20" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold tracking-tight">{destinationCity}</div>
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-3 px-5">
        <PassField label="Seat" value={ticket.seat_number} />
        <PassField label="Passenger" value={ticket.passenger_full_name.split(" ")[0] ?? ticket.passenger_full_name} />
        <PassField label="Fare" value={`${ticket.price_amount.toFixed(0)} ${ticket.currency}`} />
      </div>

      <div className="relative mt-4 flex items-center gap-2 px-5">
        <motion.span
          animate={status.pulsing ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
          transition={{ duration: 1.4, repeat: status.pulsing ? Infinity : 0 }}
          className={cn("size-1.5 rounded-full", toneDot[status.tone])}
        />
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", toneClasses[status.tone])}>{status.label}</span>
      </div>

      {stopsForMap && stopsForMap.length > 0 && (
        <div className="relative mt-4 px-5">
          <MapPinPreview stops={stopsForMap} dark className="h-20 w-full" />
        </div>
      )}

      <div className="relative my-5 text-white/25 ticket-perforation" />

      <div className="relative flex flex-col items-center gap-2 px-5 pb-3">
        <div className="rounded-lg bg-white p-2.5">
          <QrCode value={qrValue} size={148} />
        </div>
        <div className="font-mono text-xs tracking-wide text-ink-onDarkSecondary">{ticket.ticket_number}</div>
        <div className="text-[10px] uppercase tracking-wider text-ink-onDarkSecondary/70">Scan to board — verifies offline</div>
      </div>

      <div className="relative flex gap-2 border-t border-border-dark px-5 py-4">
        <Button variant="ghost-dark" size="sm" className="flex-1" onClick={() => setWalletNoticeOpen((v) => !v)}>
          <Wallet className="size-3.5" strokeWidth={1.75} />
          Add to Wallet
        </Button>
        <Button variant="electric" size="sm" className="flex-1" onClick={handleDownloadPdf}>
          <Download className="size-3.5" strokeWidth={1.75} />
          Download PDF
        </Button>
      </div>

      {walletNoticeOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="relative overflow-hidden px-5 pb-4 text-[11px] leading-relaxed text-ink-onDarkSecondary"
        >
          Native Apple/Google Wallet passes require the operator to sign a
          pass bundle with their own Wallet developer certificate — that
          isn&apos;t wired up yet. Use Download PDF for now; this ticket&apos;s QR
          scans the same either way.
        </motion.div>
      )}
    </div>
  );
}

function PassField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-onDarkSecondary/80">{label}</div>
      <div className="truncate font-mono text-sm font-bold">{value}</div>
    </div>
  );
}
