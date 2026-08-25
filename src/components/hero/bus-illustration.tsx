"use client";

import { motion, useMotionValue, useReducedMotion, type MotionValue } from "framer-motion";

interface BusIllustrationProps {
  className?: string;
  /** Degrees of tilt driven by pointer position on the hero — omit for a
   * static (touch / no-JS-motion) render. */
  tiltX?: MotionValue<number>;
  tiltY?: MotionValue<number>;
}

/**
 * Stylized 3/4-front coach — a flat-illustration perspective trick (a
 * slanted side panel receding behind an angled front face), not a literal
 * 3D model: it reads instantly at hero scale and costs nothing to animate.
 * The neon wordmark pulses via a looping opacity tween on the glow filter's
 * host <text>, and the headlight beams are two gradient triangles breathing
 * in sync — both driven by Framer Motion, not the canvas loop behind it.
 */
export function BusIllustration({ className, tiltX, tiltY }: BusIllustrationProps) {
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const reduceMotion = useReducedMotion();

  const pulseLoop = reduceMotion ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const };
  const beamOpacity = (base: number[]) => (reduceMotion ? base[1] : base);

  return (
    <motion.div
      className={className}
      style={{
        rotateX: reduceMotion ? 0 : (tiltY ?? fallbackY),
        rotateY: reduceMotion ? 0 : (tiltX ?? fallbackX),
        transformPerspective: 1200,
      }}
    >
      <motion.svg
        viewBox="-170 0 810 320"
        className="size-full drop-shadow-[0_30px_60px_rgba(0,102,255,0.25)]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      >
        <defs>
          <linearGradient id="bus-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1B2130" />
            <stop offset="55%" stopColor="#10141F" />
            <stop offset="100%" stopColor="#0A0D14" />
          </linearGradient>
          <linearGradient id="bus-stripe" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#00D084" />
          </linearGradient>
          <radialGradient id="headlight-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#BFE0FF" />
            <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beam-fill" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#BFE0FF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#BFE0FF" stopOpacity="0" />
          </linearGradient>
          <filter id="neon-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Headlight beams — drawn first so the body/glass sit on top */}
        <motion.polygon
          points="46,232 -140,190 -140,270"
          fill="url(#beam-fill)"
          animate={{ opacity: beamOpacity([0.35, 0.75, 0.35]) }}
          transition={pulseLoop}
        />
        <motion.polygon
          points="46,258 -140,232 -140,300"
          fill="url(#beam-fill)"
          animate={{ opacity: beamOpacity([0.5, 0.9, 0.5]) }}
          transition={{ ...pulseLoop, delay: reduceMotion ? 0 : 0.3 }}
        />

        {/* Side panel — recedes up-and-right to suggest depth */}
        <path d="M 96 92 L 588 66 L 600 214 L 108 250 Z" fill="url(#bus-body)" stroke="rgba(255,255,255,0.08)" />
        <path d="M 96 150 L 596 128 L 598 158 L 100 182 Z" fill="url(#bus-stripe)" opacity="0.9" />

        {/* Side windows */}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={150 + i * 84}
            y={104 - i * 4.2}
            width="62"
            height="34"
            rx="6"
            fill="rgba(191, 224, 255, 0.14)"
            stroke="rgba(191, 224, 255, 0.35)"
          />
        ))}

        {/* Roof light strip */}
        <rect x="110" y="86" width="470" height="4" rx="2" fill="#00D084" opacity="0.55" />

        {/* Neon BUSX wordmark on the side panel */}
        <motion.text
          x="330"
          y="212"
          textAnchor="middle"
          fontFamily="var(--font-jakarta), system-ui, sans-serif"
          fontWeight={800}
          fontSize="30"
          letterSpacing="2"
          fill="#EAF2FF"
          filter="url(#neon-glow)"
          animate={{ opacity: beamOpacity([0.75, 1, 0.75]) }}
          transition={{ ...pulseLoop, duration: reduceMotion ? 0 : 2.4 }}
        >
          BUS<tspan fill="#00D084">X</tspan>
        </motion.text>

        {/* Front face — angled toward the viewer */}
        <path d="M 40 108 L 96 92 L 108 250 L 46 236 Z" fill="url(#bus-body)" stroke="rgba(255,255,255,0.1)" />
        <path d="M 52 118 L 92 108 L 96 168 L 54 176 Z" fill="rgba(191, 224, 255, 0.16)" stroke="rgba(191,224,255,0.4)" />

        {/* Headlights */}
        <circle cx="58" cy="206" r="13" fill="url(#headlight-core)" />
        <circle cx="58" cy="228" r="9" fill="url(#headlight-core)" opacity="0.85" />

        {/* Wheels */}
        <g fill="#05070B" stroke="rgba(255,255,255,0.15)" strokeWidth="2">
          <circle cx="168" cy="250" r="26" />
          <circle cx="512" cy="220" r="24" />
        </g>
        <g fill="#1E2532">
          <circle cx="168" cy="250" r="11" />
          <circle cx="512" cy="220" r="10" />
        </g>
      </motion.svg>
    </motion.div>
  );
}
