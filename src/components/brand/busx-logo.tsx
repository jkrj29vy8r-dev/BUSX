/**
 * The BUSX wordmark, drawn rather than set in live type. Every letter shares
 * one cap height (240) and one stroke weight (40) on a strict grid: each
 * letter box is a golden rectangle (height:width ≈ φ) and the inter-letter
 * gap is stroke-width × φ, so B/U/S/X read as one consistent geometric
 * family rather than four unrelated shapes.
 *
 * The ligature: S's bottom bowl ends in a flat, cut terminal — not a curl —
 * which turns at a sharp geometric corner (miter join, no bezier flourish)
 * straight into X's lower-left-to-upper-right stem. X's other diagonal
 * crosses it in mint (`#00D084`); everything else inherits `currentColor`,
 * so this drops into white-on-dark (nav, operator sidebar) and
 * dark-on-light (operator picker) contexts without a color prop.
 */
export function BusxLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="-20 -20 850 280" className={className} role="img" aria-label="BUSX">
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
        d="M 233 20 L 233 165 Q 233 220 287 220 Q 341 220 341 165 L 341 20"
        stroke="currentColor"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* S — round geometric bowls into a flat terminal bar, then a sharp
          straight diagonal into X (no curved flourish at the joint) */}
      <path
        d="M 500 20 A 50 50 0 0 1 500 120 A 50 50 0 0 0 500 220 L 560 220 L 767 20"
        stroke="currentColor"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="miter"
        fill="none"
      />

      {/* X's accent diagonal */}
      <path d="M 659 20 L 767 220" stroke="#00D084" strokeWidth="40" strokeLinecap="round" />
    </svg>
  );
}
