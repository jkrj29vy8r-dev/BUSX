"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface Trail {
  angle: number;
  distance: number;
  speed: number;
  hue: "electric" | "emerald";
  prevX: number;
  prevY: number;
}

const ELECTRIC = "0, 102, 255";
const EMERALD = "0, 208, 132";

/**
 * Lightweight "highway at speed" background for the search hero — light
 * trails radiating from a vanishing point just above center, echoing the
 * Stripe Press canvas / Three.js fly-through references without the actual
 * WebGL weight: plain Canvas2D, a capped particle count, and a full stop on
 * `prefers-reduced-motion` or a hidden tab, so it never taxes a phone doing
 * the one thing this hero actually needs — a fast search form.
 */
export function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let trails: Trail[] = [];
    let raf = 0;
    let running = true;

    const COUNT = window.innerWidth < 640 ? 22 : 42;

    function vanishingPoint() {
      return { x: width * 0.62, y: height * 0.38 };
    }

    function spawn(): Trail {
      const { x, y } = vanishingPoint();
      const angle = Math.random() * Math.PI * 2;
      return {
        angle,
        distance: Math.random() * 40,
        speed: 1.4 + Math.random() * 2.2,
        hue: Math.random() < 0.62 ? "electric" : "emerald",
        prevX: x,
        prevY: y,
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

    function reset() {
      resize();
      trails = Array.from({ length: COUNT }, spawn);
    }

    function drawStatic() {
      resize();
      const { x: vx, y: vy } = vanishingPoint();
      ctx!.clearRect(0, 0, width, height);
      const glow = ctx!.createRadialGradient(vx, vy, 0, vx, vy, Math.max(width, height) * 0.6);
      glow.addColorStop(0, `rgba(${ELECTRIC}, 0.10)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, width, height);
    }

    function tick() {
      if (!running) return;
      const { x: vx, y: vy } = vanishingPoint();
      const maxDist = Math.hypot(width, height) * 0.72;

      // Fade the previous frame instead of a hard clear, so trails leave a
      // brief motion streak (`globalCompositeOperation` keeps this cheap —
      // no offscreen buffer, no per-particle history array).
      ctx!.fillStyle = "rgba(11, 15, 23, 0.28)";
      ctx!.fillRect(0, 0, width, height);

      for (const t of trails) {
        t.distance += t.speed * (1 + t.distance / maxDist) * 2.2;
        const x = vx + Math.cos(t.angle) * t.distance;
        const y = vy + Math.sin(t.angle) * t.distance * 0.72; // flatten to a road-like ellipse

        const progress = t.distance / maxDist;
        const alpha = Math.min(0.55, progress * 0.65);
        const width_ = 0.6 + progress * 2.2;
        const rgb = t.hue === "electric" ? ELECTRIC : EMERALD;

        ctx!.strokeStyle = `rgba(${rgb}, ${alpha})`;
        ctx!.lineWidth = width_;
        ctx!.lineCap = "round";
        ctx!.beginPath();
        ctx!.moveTo(t.prevX, t.prevY);
        ctx!.lineTo(x, y);
        ctx!.stroke();

        t.prevX = x;
        t.prevY = y;

        if (t.distance > maxDist || x < -40 || x > width + 40 || y < -40 || y > height + 40) {
          Object.assign(t, spawn());
        }
      }

      raf = requestAnimationFrame(tick);
    }

    if (reduceMotion) {
      drawStatic();
    } else {
      reset();
      raf = requestAnimationFrame(tick);
    }

    function handleVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        running = true;
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
