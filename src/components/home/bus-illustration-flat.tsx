/**
 * The official BUSX coach mark — a 3/4 front perspective with soft, subtle
 * shading for a sense of volume (not the flat side-elevation this replaced,
 * and not the neon/glowing hero version from earlier either — no gradients
 * pretending to be chrome, no glow). Used once, deliberately, in the
 * onboard-experience section rather than as ambient decoration.
 */
export function BusIllustrationFlat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 400" className={className} role="img" aria-label="Ilustrație autocar BUSX">
      <defs>
        <radialGradient id="bus-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0B0F17" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0B0F17" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bus-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EEF2F7" />
        </linearGradient>
        <linearGradient id="bus-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5F9FF" />
          <stop offset="100%" stopColor="#DCEAFF" />
        </linearGradient>
        <linearGradient id="bus-stripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0052D6" />
          <stop offset="100%" stopColor="#0066FF" />
        </linearGradient>
      </defs>

      <ellipse cx="465" cy="352" rx="410" ry="20" fill="url(#bus-shadow)" />

      {/* Side panel + roof — front (left) taller than the receding rear (right) for a mild 3/4 perspective */}
      <path
        d="M 96 300 L 96 132 Q 96 100 128 96 L 300 84 Q 560 76 796 128 Q 812 132 812 148 L 812 292 Q 812 300 804 300 L 104 300 Q 96 300 96 300 Z"
        fill="url(#bus-body)"
        stroke="#CBD5E1"
        strokeWidth="3"
      />

      {/* Front face */}
      <path d="M 96 300 L 96 132 Q 96 100 128 96 L 168 92 L 168 300 Z" fill="url(#bus-body)" stroke="#CBD5E1" strokeWidth="3" />
      <path d="M 108 134 Q 108 112 130 109 L 156 106 L 156 168 L 108 168 Z" fill="url(#bus-glass)" stroke="#0066FF" strokeWidth="2" />
      <rect x="112" y="220" width="42" height="18" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
      <rect x="118" y="252" width="14" height="9" rx="2.5" fill="#0066FF" />
      <rect x="140" y="252" width="14" height="9" rx="2.5" fill="#0066FF" />

      {/* Roofline accent + windows, gently rising toward the rear */}
      <path d="M 178 100 Q 480 88 800 138" fill="none" stroke="#CBD5E1" strokeWidth="3" />
      {Array.from({ length: 8 }, (_, i) => {
        const x = 196 + i * 76;
        const y = 118 - i * 3.4;
        const w = 56 - i * 1.2;
        return <rect key={i} x={x} y={y} width={w} height="36" rx="7" fill="url(#bus-glass)" stroke="#0066FF" strokeWidth="2" />;
      })}

      {/* Blue belt stripe, tapering slightly with the perspective */}
      <path d="M 168 214 Q 480 202 806 244 L 806 258 Q 480 216 168 228 Z" fill="url(#bus-stripe)" />

      {/* BUSX wordmark */}
      <text x="470" y="192" textAnchor="middle" fontFamily="var(--font-jakarta), system-ui, sans-serif" fontWeight={800} fontSize="34" letterSpacing="1" fill="#0B0F17">
        BUS<tspan fill="#00D084">X</tspan>
      </text>
      <text x="470" y="222" textAnchor="middle" fontFamily="var(--font-jakarta), system-ui, sans-serif" fontWeight={600} fontSize="11" letterSpacing="3" fill="#64748B">
        EXPRESS COACH
      </text>

      {/* Door, near the rear */}
      <rect x="726" y="238" width="42" height="60" rx="4" fill="url(#bus-glass)" stroke="#0066FF" strokeWidth="2" />
      <line x1="747" y1="238" x2="747" y2="298" stroke="#0066FF" strokeWidth="1.5" />

      {/* Tail lamp */}
      <rect x="792" y="238" width="12" height="20" rx="4" fill="#00D084" />

      {/* Wheels with rim detail — same baseline as the body's flat floor */}
      {[{ cx: 246, cy: 314, r: 34 }, { cx: 700, cy: 314, r: 30 }].map((w) => (
        <g key={w.cx}>
          <circle cx={w.cx} cy={w.cy} r={w.r} fill="#12161F" />
          <circle cx={w.cx} cy={w.cy} r={w.r - 6} fill="none" stroke="#2A3242" strokeWidth="2" />
          <circle cx={w.cx} cy={w.cy} r={w.r * 0.4} fill="#F1F5F9" />
        </g>
      ))}
    </svg>
  );
}
