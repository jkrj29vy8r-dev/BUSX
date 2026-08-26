/**
 * The BUSX wordmark: clean geometric sans-serif type (Plus Jakarta Sans,
 * weight 800, tight -0.04em tracking) with a small route-line accent —
 * two nodes joined by a line, standing for a trip's start and end — set
 * in brand mint to the left of the wordmark. "X" and the route icon are
 * always solid brand mint (`#00D084`); "BUS" depends on `variant`:
 *
 * - "light": solid Slate-900 (`#0F172A`), for light surfaces.
 * - "dark": solid white, for the dark nav bar and operator sidebar.
 * - "auto" (default): `currentColor`, inheriting whatever text color the
 *   parent already sets — the old behavior, kept for any caller that
 *   hasn't picked an explicit variant yet.
 */
export type BusxLogoVariant = "light" | "dark" | "auto";

const BUS_FILL: Record<BusxLogoVariant, string> = {
  light: "#0F172A",
  dark: "#FFFFFF",
  auto: "currentColor",
};

export function BusxLogo({
  className,
  variant = "auto",
}: {
  className?: string;
  variant?: BusxLogoVariant;
}) {
  return (
    <svg viewBox="-3 -3 136 49" className={className} role="img" aria-label="BUSX">
      <line x1="4" y1="25" x2="26" y2="25" stroke="#00D084" strokeWidth="3" strokeLinecap="round" />
      <circle cx="4" cy="25" r="4" fill="#00D084" />
      <circle cx="26" cy="25" r="3.5" fill="none" stroke="#00D084" strokeWidth="3" />
      <text
        x="38"
        y="36"
        fontFamily="var(--font-jakarta), system-ui, sans-serif"
        fontWeight={800}
        fontSize="34"
        letterSpacing="-1.36"
      >
        <tspan fill={BUS_FILL[variant]}>BUS</tspan>
        <tspan fill="#00D084">X</tspan>
      </text>
    </svg>
  );
}
