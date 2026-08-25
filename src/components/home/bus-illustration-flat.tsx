/**
 * The official BUSX coach mark — flat, corporate, side-profile vector: no
 * gradients pretending to be chrome, no glow, no perspective tricks. This is
 * the "we're a real company" register (closer to a fleet-spec drawing than a
 * hero illustration), used once, deliberately, in the onboard-experience
 * section rather than as ambient decoration.
 */
export function BusIllustrationFlat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 320" className={className} role="img" aria-label="Ilustrație autocar BUSX">
      <rect x="40" y="90" width="700" height="150" rx="28" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />
      <rect x="40" y="150" width="700" height="18" fill="#0066FF" />

      {/* Windshield + rear cap, slightly rounded ends */}
      <path d="M 40 118 Q 40 90 68 90 L 100 90 L 100 168 L 40 168 Z" fill="#EAF2FF" stroke="#CBD5E1" strokeWidth="3" />
      <path d="M 760 90 L 712 90 L 712 168 L 760 168 Z" fill="#EAF2FF" stroke="#CBD5E1" strokeWidth="3" />

      {/* Passenger windows */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={130 + i * 62} y="104" width="46" height="38" rx="7" fill="#EAF2FF" stroke="#0066FF" strokeWidth="2" />
      ))}

      {/* BUSX wordmark on the side panel */}
      <text x="400" y="212" textAnchor="middle" fontFamily="var(--font-jakarta), system-ui, sans-serif" fontWeight={800} fontSize="30" letterSpacing="1" fill="#0B0F17">
        BUS<tspan fill="#00D084">X</tspan>
      </text>
      <text x="400" y="230" textAnchor="middle" fontFamily="var(--font-jakarta), system-ui, sans-serif" fontWeight={600} fontSize="10" letterSpacing="3" fill="#64748B">
        EXPRESS COACH
      </text>

      {/* Door */}
      <rect x="612" y="176" width="40" height="58" rx="4" fill="#EAF2FF" stroke="#0066FF" strokeWidth="2" />
      <line x1="632" y1="176" x2="632" y2="234" stroke="#0066FF" strokeWidth="1.5" />

      {/* Headlamp + taillamp */}
      <rect x="46" y="176" width="16" height="10" rx="3" fill="#0066FF" />
      <rect x="738" y="176" width="16" height="10" rx="3" fill="#00D084" />

      {/* Wheels */}
      <g fill="#0B0F17">
        <circle cx="196" cy="244" r="30" />
        <circle cx="604" cy="244" r="30" />
      </g>
      <g fill="#FFFFFF">
        <circle cx="196" cy="244" r="12" />
        <circle cx="604" cy="244" r="12" />
      </g>

      {/* Ground line */}
      <line x1="20" y1="274" x2="780" y2="274" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
