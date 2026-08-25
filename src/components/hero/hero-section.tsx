"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SearchHero } from "@/components/search-hero";
import { HighwayCanvas } from "@/components/hero/highway-canvas";
import { BusIllustration } from "@/components/hero/bus-illustration";

/**
 * The cinematic homepage hero: a full-bleed dark highway canvas, a
 * perspective coach with pulsing neon branding and headlight beams that
 * tilts toward the pointer, and the glass search dock floating above both.
 * Owns the mouse-parallax so a single listener drives the tilt rather than
 * every descendant tracking the pointer independently.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);
  const tiltX = useSpring(rawTiltX, { stiffness: 120, damping: 16 });
  const tiltY = useSpring(rawTiltY, { stiffness: 120, damping: 16 });

  function handlePointerMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawTiltX.set(nx * 14);
    rawTiltY.set(-ny * 8);
  }

  function handlePointerLeave() {
    rawTiltX.set(0);
    rawTiltY.set(0);
  }

  return (
    <div
      ref={sectionRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      className="relative overflow-hidden bg-[#070A0F] pb-14 pt-10 sm:pb-20 sm:pt-14"
    >
      <HighwayCanvas />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070A0F] via-[#070A0F]/40 to-transparent" />

      <div
        aria-hidden
        className="pointer-events-none absolute right-[-6%] top-1/2 hidden w-[46%] max-w-xl -translate-y-1/2 lg:block"
      >
        <BusIllustration tiltX={tiltX} tiltY={tiltY} />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-8 flex max-w-xl flex-col gap-3">
          <Badge variant="on-dark" className="w-fit">
            <Radio className="size-3 text-emerald" strokeWidth={2.25} />
            Locuri disponibile în timp real, la toți operatorii
          </Badge>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Călătorii interurbane, rezervate în câteva secunde.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-md text-ink-onDarkSecondary"
          >
            Caută orice stație de pe traseu — nu doar capetele de linie — și
            plătești doar segmentul pe care îl parcurgi.
          </motion.p>
        </div>

        <div className="max-w-2xl">
          <SearchHero />
        </div>
      </div>
    </div>
  );
}
