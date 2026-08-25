"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const BASE = "7, 10, 15"; // #070A0F
const ELECTRIC = "0, 102, 255";
const EMERALD = "0, 208, 132";

interface LaneDash {
  lane: number; // -2..2, offset index from center
  z: number; // 0 (at horizon) .. 1 (at viewer), loops
  speed: number;
  color: string;
}

interface Spark {
  x: number;
  y: number;
  r: number;
  phase: number;
  drift: number;
}

const LANES = [-2, -1, 1, 2];
const DASHES_PER_LANE = 5;

function easeIn(t: number) {
  return t * t;
}

/**
 * The hero's living backdrop: a perspective highway rushing at the viewer —
 * dashed neon lane lines converging on a vanishing point, plus a scatter of
 * drifting "city light" sparks in the dark atmosphere around it. Plain
 * Canvas2D on purpose (no Three.js/WebGL): a hero background has to stay out
 * of the way of the search form's input latency, so the budget is a handful
 * of stroked paths per frame, a capped device pixel ratio, a hard stop on
 * `prefers-reduced-motion`, and a pause whenever the tab isn't visible.
 */
export function HighwayCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.innerWidth < 640;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let dashes: LaneDash[] = [];
    let sparks: Spark[] = [];
    let raf = 0;
    let running = true;
    let lastT = performance.now();

    function vanishingPoint() {
      return { x: width * 0.5, y: height * 0.3 };
    }

    function spawnDash(lane: number, z = Math.random()): LaneDash {
      return { lane, z, speed: 0.18 + Math.random() * 0.1, color: lane < 0 ? ELECTRIC : EMERALD };
    }

    function spawnSpark(): Spark {
      return {
        x: Math.random() * width,
        y: Math.random() * height * 0.75,
        r: 0.5 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        drift: 0.06 + Math.random() * 0.1,
      };
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function populate() {
      resize();
      dashes = LANES.flatMap((lane) =>
        Array.from({ length: DASHES_PER_LANE }, (_, i) => spawnDash(lane, i / DASHES_PER_LANE))
      );
      const sparkCount = isSmall ? 26 : 60;
      sparks = Array.from({ length: sparkCount }, spawnSpark);
    }

    function drawStatic() {
      resize();
      const { x: vx, y: vy } = vanishingPoint();
      ctx!.fillStyle = `rgb(${BASE})`;
      ctx!.fillRect(0, 0, width, height);
      const glow = ctx!.createRadialGradient(vx, vy, 0, vx, vy, Math.max(width, height) * 0.55);
      glow.addColorStop(0, `rgba(${ELECTRIC}, 0.14)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, width, height);
    }

    function tick(now: number) {
      if (!running) return;
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      const { x: vx, y: vy } = vanishingPoint();
      ctx!.fillStyle = `rgb(${BASE})`;
      ctx!.fillRect(0, 0, width, height);

      // Ambient vanishing-point glow, like distant headlamp wash on the road.
      const glow = ctx!.createRadialGradient(vx, vy, 0, vx, vy, Math.max(width, height) * 0.5);
      glow.addColorStop(0, `rgba(${ELECTRIC}, 0.10)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, width, height);

      // City-light sparks — slow upward drift, gentle twinkle.
      for (const s of sparks) {
        s.y -= s.drift;
        if (s.y < -4) Object.assign(s, spawnSpark(), { y: height + 4 });
        const twinkle = 0.35 + 0.35 * Math.sin(now / 900 + s.phase);
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.55})`;
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Perspective dashed lane lines rushing toward the viewer.
      for (const d of dashes) {
        d.z += d.speed * dt;
        if (d.z > 1) Object.assign(d, spawnDash(d.lane, 0));

        const eased = easeIn(d.z);
        const spread = width * 0.16 * d.lane;
        const yStart = vy + eased * (height * 1.15 - vy);
        const dashLen = 6 + eased * 46;
        const xStart = vx + spread * eased;

        const nextZ = Math.min(d.z + 0.02, 1);
        const nextEased = easeIn(nextZ);
        const yEnd = vy + nextEased * (height * 1.15 - vy);
        const xEnd = vx + width * 0.16 * d.lane * nextEased;

        const alpha = 0.15 + eased * 0.55;
        ctx!.strokeStyle = `rgba(${d.color}, ${alpha})`;
        ctx!.lineWidth = 1 + eased * 3;
        ctx!.lineCap = "round";
        ctx!.shadowColor = `rgba(${d.color}, ${alpha})`;
        ctx!.shadowBlur = 6 + eased * 10;
        ctx!.beginPath();
        ctx!.moveTo(xStart, yStart - dashLen * 0.4);
        ctx!.lineTo(xEnd, yEnd + dashLen * 0.4);
        ctx!.stroke();
      }
      ctx!.shadowBlur = 0;

      raf = requestAnimationFrame(tick);
    }

    if (reduceMotion) {
      drawStatic();
    } else {
      populate();
      raf = requestAnimationFrame(tick);
    }

    function handleVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        running = true;
        lastT = performance.now();
        raf = requestAnimationFrame(tick);
      }
    }

    function handleResize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (reduceMotion) drawStatic();
      else resize();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", handleResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 size-full", className)} />;
}
