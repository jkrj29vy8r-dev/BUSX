/**
 * The BUSX wordmark: clean geometric sans-serif type (Plus Jakarta Sans,
 * weight 800, tight -0.04em tracking) with a small route-line accent —
 * two nodes joined by a line, standing for a trip's start and end — set
 * in brand mint to the left of the wordmark. "BUS" inherits `currentColor`
 * so the mark adapts to both the dark nav bar and light surfaces; "X" and
 * the route icon are solid brand mint (`#00D084`).
 */
export function BusxLogo({ className }: { className?: string }) {
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
        <tspan fill="currentColor">BUS</tspan>
        <tspan fill="#00D084">X</tspan>
      </text>
    </svg>
  );
}
