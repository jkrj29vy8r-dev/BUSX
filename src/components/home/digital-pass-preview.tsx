"use client";

import { motion } from "framer-motion";
import { QrCode as QrCodeIcon, ShieldCheck, Smartphone, WifiOff } from "lucide-react";
import { QrCode } from "@/components/qr-code";

const POINTS = [
  { icon: QrCodeIcon, text: "Codul QR este biletul — nimic de tipărit, nimic de căutat în email." },
  { icon: WifiOff, text: "Semnătura biletului se verifică și offline, direct la urcare." },
  { icon: ShieldCheck, text: "Statusul cursei se actualizează live, până la ora reală de sosire." },
];

/** A demo pass, not a real ticket — same visual grammar as the real
 * `TicketPass` (see that component), simplified to what a marketing
 * screenshot needs: no wallet/PDF actions, a placeholder QR value instead of
 * an HMAC-signed one. */
export function DigitalPassPreview() {
  return (
    <section className="bg-[#F0F4FF] py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <div className="flex items-center gap-2 text-electric">
            <Smartphone className="size-5" strokeWidth={2} />
            <span className="text-xs font-bold uppercase tracking-wide">Bilet digital</span>
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Biletul tău digital, cu urmărire live
          </h2>
          <p className="mt-3 max-w-md text-md text-ink-secondary">
            De la confirmarea comenzii până la coborâre, biletul stă pe
            telefon — iar starea cursei se vede în timp real, nu doar la
            check-in.
          </p>
          <ul className="mt-6 flex flex-col gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-electric shadow-subtle">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="pt-1 text-sm text-ink-secondary">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          {/* Phone frame */}
          <div className="relative w-[280px] rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-panel">
            <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-ink" />
            <div className="relative overflow-hidden rounded-[1.75rem] bg-surface-dark texture-noise">
              <div className="pointer-events-none absolute inset-0 bg-dark-grid-fade" />

              <div className="relative flex flex-col items-center px-5 pb-6 pt-9">
                <div className="mb-4 flex w-full items-center justify-between">
                  <span className="text-sm font-extrabold tracking-tight text-white">
                    BUS<span className="text-emerald">X</span> Pass
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">
                    Demo
                  </span>
                </div>

                <div className="w-full text-left">
                  <div className="text-[11px] text-ink-onDarkSecondary">Piatra Neamț → Otopeni</div>
                  <div className="mt-1.5 flex items-end justify-between">
                    <span className="text-xl font-extrabold text-white">Piatra Neamț</span>
                    <span className="text-xl font-extrabold text-white">Otopeni</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 self-start">
                  <motion.span
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="size-1.5 rounded-full bg-emerald"
                  />
                  <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[11px] font-semibold text-emerald">
                    Autocar în traseu — sosire în 8 min
                  </span>
                </div>

                <div className="mt-5 rounded-lg bg-white p-2.5">
                  <QrCode value="BUSX-DEMO-PREVIEW" size={148} />
                </div>
                <div className="mt-2 font-mono text-[11px] tracking-wide text-ink-onDarkSecondary">
                  BUSX-2026-DEMO01
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
