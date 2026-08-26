/**
 * The BUSX wordmark. After three rounds of hand-drawn ligatures (the S→X
 * connector kept reading as a handwritten scribble, no matter how the joint
 * was constructed), this drops the custom connection entirely: bold,
 * heavy-weight geometric sans type — Plus Jakarta Sans ExtraBold, the same
 * family already used everywhere else in the product — set in all caps,
 * uniform weight across all four letters. "BUS" inherits `currentColor` (so
 * it's white-on-dark in the nav/sidebar and dark-on-light on the operator
 * picker); "X" is solid brand mint (`#00D084`). No custom vector geometry
 * left to get wrong.
 */
export function BusxLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="-2 -8 108 54" className={className} role="img" aria-label="BUSX">
      <text
        x="0"
        y="34"
        fontFamily="var(--font-jakarta), system-ui, sans-serif"
        fontWeight={800}
        fontSize="38"
        letterSpacing="-0.5"
      >
        <tspan fill="currentColor">BUS</tspan>
        <tspan fill="#00D084">X</tspan>
      </text>
    </svg>
  );
}
