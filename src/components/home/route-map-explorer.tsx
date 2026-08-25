"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useHomeSearchStore } from "@/store/home-search-store";

interface CityPin {
  city: string;
  latitude: number;
  longitude: number;
  fromPriceRon: number;
}

// Real coordinates — the same normalize-and-plot approach as MapPinPreview,
// just at explorer scale with more cities and no real map tile provider
// wired up in this environment (see that component's doc comment).
const CITIES: CityPin[] = [
  { city: "Piatra Neamț", latitude: 46.9275, longitude: 26.3708, fromPriceRon: 45 },
  { city: "Roman", latitude: 46.9226, longitude: 26.9319, fromPriceRon: 40 },
  { city: "Bacău", latitude: 46.567, longitude: 26.9146, fromPriceRon: 55 },
  { city: "Iași", latitude: 47.1585, longitude: 27.6014, fromPriceRon: 75 },
  { city: "Otopeni", latitude: 44.5711, longitude: 26.0858, fromPriceRon: 90 },
  { city: "Constanța", latitude: 44.1598, longitude: 28.6348, fromPriceRon: 110 },
];

const PADDING = 0.12;
const lats = CITIES.map((c) => c.latitude);
const lngs = CITIES.map((c) => c.longitude);
const minLat = Math.min(...lats) - PADDING;
const maxLat = Math.max(...lats) + PADDING;
const minLng = Math.min(...lngs) - PADDING;
const maxLng = Math.max(...lngs) + PADDING;
const latSpan = maxLat - minLat;
const lngSpan = maxLng - minLng;

const points = CITIES.map((c) => ({
  ...c,
  x: ((c.longitude - minLng) / lngSpan) * 100,
  y: 100 - ((c.latitude - minLat) / latSpan) * 100,
}));

/**
 * "Unde zburăm pe roți?" — a stylized network map (real city coordinates,
 * no live map tiles — this environment has no billed maps API key; see
 * MapPinPreview's doc comment for the same call made there). Clicking a pin
 * pushes that city into the shared home-search-store; SearchHero resolves
 * it against the real stop-search API and fills the destination field.
 */
export function RouteMapExplorer() {
  const requestDestination = useHomeSearchStore((s) => s.requestDestination);

  function handlePick(city: string) {
    requestDestination(city);
    document.getElementById("search-dock")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section className="bg-[#F8FAFC] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Unde zburăm pe roți?</h2>
          <p className="mt-2 text-md text-ink-secondary">Atinge un oraș ca să-l completezi direct în căutare.</p>
        </div>

        <div className="relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle sm:aspect-[20/9]">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <defs>
              <pattern id="explorer-grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(11,15,23,0.05)" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#explorer-grid)" />
            {points.slice(1).map((p) => (
              <line
                key={p.city}
                x1={points[0]!.x}
                y1={points[0]!.y}
                x2={p.x}
                y2={p.y}
                stroke="rgba(0,102,255,0.15)"
                strokeWidth="0.4"
                strokeDasharray="1.4 1.2"
              />
            ))}
          </svg>

          {points.map((p, i) => (
            // Positioning lives on this plain div, deliberately untouched by
            // Framer Motion: once a descendant motion element animates
            // `scale`/`y`, Framer Motion takes over that element's whole
            // `transform` property and silently drops any Tailwind
            // translate-x/y classes on it — which is exactly what put every
            // pin's anchor point in the wrong place (worst on Constanța,
            // whose taller two-line label then overflowed the card).
            <div
              key={p.city}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <motion.button
                type="button"
                onClick={() => handlePick(p.city)}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.05 }}
                className="group block"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center"
                >
                  <span className="mb-1 flex items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink shadow-panel transition-colors group-hover:border-electric group-hover:text-electric">
                    {p.city} <span className="text-ink-tertiary">·</span> de la {p.fromPriceRon} LEI
                  </span>
                  <MapPin className="size-6 fill-electric text-white drop-shadow" strokeWidth={1.5} />
                </motion.div>
              </motion.button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
