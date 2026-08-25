const RIM_ANGLES = [0, 72, 144, 216, 288];

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rimR = r * 0.68;
  const hubR = r * 0.22;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#14181F" />
      <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke="#2E3644" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={rimR} fill="#D7DEE8" />
      {RIM_ANGLES.map((angle) => (
        <rect
          key={angle}
          x={cx - 3.5}
          y={cy - rimR + 4}
          width="7"
          height={rimR - hubR - 2}
          rx="3"
          fill="#9AA5B4"
          transform={`rotate(${angle} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={hubR} fill="#0066FF" />
      <circle cx={cx} cy={cy} r={hubR * 0.4} fill="#EAF2FF" />
    </g>
  );
}

/**
 * The official BUSX coach mark. A clean side profile with the details that
 * actually read as "designed" rather than "AI clip-art": wheel arches cut
 * into a single continuous body silhouette (not circles floating under a
 * box), alloy-spoke rims, a glowing LED headlight, one continuous tinted
 * glass band with a reflection streak instead of a robotic row of separate
 * window rectangles, and the wordmark printed directly on the livery
 * stripe — the way an actual coach is painted, not stuck on the body.
 */
export function BusIllustrationFlat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 400" className={className} role="img" aria-label="Ilustrație autocar BUSX">
      <defs>
        <linearGradient id="bx-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="75%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E7ECF3" />
        </linearGradient>
        <linearGradient id="bx-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#33445E" />
          <stop offset="100%" stopColor="#5A7291" />
        </linearGradient>
        <linearGradient id="bx-stripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0052D6" />
          <stop offset="55%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#0052D6" />
        </linearGradient>
        <radialGradient id="bx-headlight-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#BFE0FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#BFE0FF" stopOpacity="0" />
        </radialGradient>
        <filter id="bx-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#0B0F17" floodOpacity="0.18" />
        </filter>
        <filter id="bx-glow-blur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id="bx-body-clip">
          <path d="M 130 100 L 800 100 Q 830 100 830 130 L 830 260 Q 830 300 800 300 L 706 300 A 46 46 0 0 1 614 300 L 266 300 A 50 50 0 0 1 166 300 L 96 300 Q 70 300 70 274 L 70 220 Z" />
        </clipPath>
      </defs>

      <g filter="url(#bx-shadow)">
        {/* Body silhouette — one continuous path, wheel arches cut directly into it */}
        <path
          d="M 130 100 L 800 100 Q 830 100 830 130 L 830 260 Q 830 300 800 300
             L 706 300 A 46 46 0 0 1 614 300
             L 266 300 A 50 50 0 0 1 166 300
             L 96 300 Q 70 300 70 274 L 70 220 L 130 100 Z"
          fill="url(#bx-body)"
          stroke="#C7D0DC"
          strokeWidth="3"
        />

        {/* Tinted glass band — one piece, not a row of separate windows */}
        <rect x="150" y="116" width="642" height="46" rx="10" fill="url(#bx-glass)" clipPath="url(#bx-body-clip)" />
        <path d="M 150 162 L 210 116 L 250 116 L 190 162 Z" fill="#FFFFFF" opacity="0.16" clipPath="url(#bx-body-clip)" />
        <path d="M 420 162 L 480 116 L 520 116 L 460 162 Z" fill="#FFFFFF" opacity="0.16" clipPath="url(#bx-body-clip)" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={150 + i * 82.7} y="112" width="4" height="54" fill="#E7ECF3" />
        ))}

        {/* Windshield */}
        <path d="M 92 224 L 128 112 L 130 100 L 70 220 L 70 260 Z" fill="url(#bx-glass)" opacity="0.92" />

        {/* Livery stripe with the wordmark painted directly on it */}
        <rect x="70" y="204" width="760" height="40" fill="url(#bx-stripe)" clipPath="url(#bx-body-clip)" />
        <text
          x="470"
          y="231"
          textAnchor="middle"
          fontFamily="var(--font-jakarta), system-ui, sans-serif"
          fontWeight={800}
          fontSize="24"
          letterSpacing="2"
          fill="#FFFFFF"
        >
          BUS<tspan fill="#00D084">X</tspan> EXPRESS
        </text>

        {/* Mint speed lines ahead of the front wheel */}
        {[0, 1, 2].map((i) => (
          <line key={i} x1={40 - i * 4} y1={268 + i * 14} x2={78 - i * 4} y2={256 + i * 14} stroke="#00D084" strokeWidth="4" strokeLinecap="round" opacity={0.55 - i * 0.15} />
        ))}

        {/* LED headlight */}
        <circle cx="82" cy="242" r="20" fill="url(#bx-headlight-glow)" filter="url(#bx-glow-blur)" />
        <circle cx="82" cy="242" r="9" fill="#F5FAFF" />
        <circle cx="82" cy="242" r="9" fill="none" stroke="#0066FF" strokeWidth="2" />

        {/* Door + rear lamp */}
        <rect x="742" y="212" width="46" height="82" rx="4" fill="url(#bx-glass)" clipPath="url(#bx-body-clip)" opacity="0.85" />
        <line x1="765" y1="212" x2="765" y2="294" stroke="#0B0F17" strokeWidth="1.5" opacity="0.3" />
        <rect x="806" y="150" width="10" height="18" rx="3" fill="#00D084" />

        <Wheel cx={216} cy={300} r={50} />
        <Wheel cx={660} cy={300} r={46} />
      </g>
    </svg>
  );
}
