"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";

interface GeoStop {
  name: string;
  latitude: number;
  longitude: number;
}

interface MapPinPreviewProps {
  stops: GeoStop[];
  highlightIndex?: number;
  className?: string;
  /** Renders for the dark-slate ticket pass instead of the light canvas. */
  dark?: boolean;
}

/**
 * A stylized, self-contained route preview built from the stops' real
 * lat/lng — NOT a Google Maps embed. Rendering a live Google/Mapbox map
 * requires a billed API key this environment doesn't have; faking a map
 * screenshot would be actively misleading. This draws an abstract
 * terrain-grid backdrop with the real route path and pins plotted by
 * normalized coordinates, and is a drop-in slot: swap the SVG body for a
 * `<GoogleMap>`/`<Map>` (react-map-gl, @vis.gl/react-google-maps, …) once a
 * key is provisioned — the lat/lng plumbing above it stays the same.
 */
export function MapPinPreview({ stops, highlightIndex, className, dark }: MapPinPreviewProps) {
  if (stops.length === 0) return null;

  const lats = stops.map((s) => s.latitude);
  const lngs = stops.map((s) => s.longitude);
  const padding = 0.08;
  const minLat = Math.min(...lats) - padding;
  const maxLat = Math.max(...lats) + padding;
  const minLng = Math.min(...lngs) - padding;
  const maxLng = Math.max(...lngs) + padding;
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  const points = stops.map((s) => ({
    ...s,
    x: ((s.longitude - minLng) / lngSpan) * 100,
    y: 100 - ((s.latitude - minLat) / latSpan) * 100,
  }));

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const gridId = dark ? "map-grid-dark" : "map-grid-light";
  const gridStroke = dark ? "rgba(255,255,255,0.10)" : "rgba(11,15,23,0.06)";
  const pinFill = dark ? "#151A24" : "#0B0F17";
  const pinStroke = dark ? "#0B0F17" : "white";
  const labelBg = dark ? "bg-white text-ink" : "bg-ink text-white";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border",
        dark ? "border-white/10 bg-white/[0.04]" : "border-border bg-surface-inset",
        className
      )}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <pattern id={gridId} width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 6 0 L 0 0 0 6" fill="none" stroke={gridStroke} strokeWidth="0.4" />
          </pattern>
          <linearGradient id="route-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#00D084" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${gridId})`} />
        <motion.path
          d={path}
          fill="none"
          stroke="url(#route-line)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeDasharray="3 2.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle
            key={p.name + i}
            cx={p.x}
            cy={p.y}
            r={i === highlightIndex ? 1.6 : 1}
            fill={i === highlightIndex ? "#0066FF" : pinFill}
            stroke={pinStroke}
            strokeWidth="0.6"
          />
        ))}
      </svg>

      {highlightIndex !== undefined && points[highlightIndex] && (
        <div
          className="absolute -translate-x-1/2 -translate-y-[calc(100%+4px)]"
          style={{ left: `${points[highlightIndex].x}%`, top: `${points[highlightIndex].y}%` }}
        >
          <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-panel", labelBg)}>
            <MapPin className="size-2.5" strokeWidth={2.5} />
            {points[highlightIndex].name}
          </div>
        </div>
      )}

      <div
        className={cn(
          "absolute bottom-1.5 right-2 text-[9px] font-medium uppercase tracking-wide",
          dark ? "text-white/40" : "text-ink-tertiary/70"
        )}
      >
        Previzualizare traseu
      </div>
    </div>
  );
}
