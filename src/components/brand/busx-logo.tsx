/**
 * The BUSX wordmark, as an actual drawn logotype rather than live text: a
 * bold geometric "BUS" where the bottom curve of the S flows, in one
 * unbroken stroke, into the rising diagonal of the X — the road/highway
 * connecting the two halves of the name. The X's other diagonal crosses it
 * in mint (`#00D084`); everything else inherits `currentColor`, so this
 * drops into white-on-dark contexts (nav, ticket surfaces) and dark-on-light
 * ones (the operator picker) without a color prop.
 */
export function BusxLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="-15 -15 850 280" className={className} role="img" aria-label="BUSX">
      <path
        d="M 40 20 L 40 230"
        stroke="currentColor"
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path
        d="M 40 20 Q 150 20 150 70 Q 150 116 45 120 Q 158 124 158 178 Q 158 230 40 230"
        stroke="currentColor"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 210 20 L 210 165 Q 210 230 275 230 Q 340 230 340 165 L 340 20"
        stroke="currentColor"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* S, flowing into X's rising diagonal */}
      <path
        d="M 490 20 C 550 32 550 98 490 112 C 430 126 430 192 490 205 Q 560 230 790 20"
        stroke="currentColor"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* X's accent diagonal */}
      <path d="M 560 20 L 790 220" stroke="#00D084" strokeWidth="30" strokeLinecap="round" />
    </svg>
  );
}
