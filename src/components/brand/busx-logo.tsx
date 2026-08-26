/**
 * The BUSX wordmark, drawn as custom geometry. B and U sit on a plain
 * monoline grid (cap height 240, stroke 40, tight -0.03em-equivalent
 * tracking). Two deliberate twists on that grid:
 *
 * - S is a single monoline curve, tilted -8° on its own center — a road
 *   curving away rather than a static vertical letter.
 * - X is split: its two diagonals stop just short of their crossing point
 *   instead of overlapping, leaving a small negative-space gap. The
 *   top-right-to-bottom-left arm inherits `currentColor` (matching B/U/S);
 *   the top-left-to-bottom-right arm is solid brand mint (`#00D084`).
 *
 * Both twists stay inside the same cap-height/stroke-weight envelope as
 * B and U, so the mark still reads as one family, not four unrelated marks.
 */
export function BusxLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="-30 -40 800 340" className={className} role="img" aria-label="BUSX">
      {/* B */}
      <path d="M 20 20 L 20 220" stroke="currentColor" strokeWidth="40" strokeLinecap="round" />
      <path
        d="M 20 20 Q 128 20 128 68 Q 128 112 22 118 Q 134 122 134 172 Q 134 220 20 220"
        stroke="currentColor"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* U */}
      <path
        d="M 213 20 L 213 165 Q 213 220 267 220 Q 321 220 321 165 L 321 20"
        stroke="currentColor"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* S — monoline curve, tilted into a road-curve lean */}
      <g transform="rotate(-8 460 120)">
        <path
          d="M 534 20 C 414 20 392 75 460 120 C 528 165 505 220 386 220"
          stroke="currentColor"
          strokeWidth="40"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* X — split at the crossing: a deliberate negative-space gap, not an overlap */}
      <path d="M 707 20 L 667.3 93.6" stroke="currentColor" strokeWidth="40" strokeLinecap="round" />
      <path d="M 638.7 146.4 L 599 220" stroke="currentColor" strokeWidth="40" strokeLinecap="round" />
      <path d="M 599 20 L 638.7 93.6" stroke="#00D084" strokeWidth="40" strokeLinecap="round" />
      <path d="M 667.3 146.4 L 707 220" stroke="#00D084" strokeWidth="40" strokeLinecap="round" />
    </svg>
  );
}
