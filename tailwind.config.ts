import type { Config } from "tailwindcss";

// Design language: Linear.app (crisp 1px borders, restrained motion, dense
// information) meets Omio (light, trustworthy, high-contrast travel UI).
// Light-mode canvas with a dark-slate glass nav/pass treatment for premium
// contrast moments — not a soft, rounded, gradient-heavy "AI generated" look.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F5F8", // page background — Ultra Light Gray
        surface: {
          DEFAULT: "#FFFFFF",
          inset: "#EDEEF2", // wells: seat map deck, code/QR panels
          dark: "#0B0F17", // Dark Slate — nav, footer, ticket pass
          "dark-raised": "#151A24",
        },
        border: {
          DEFAULT: "rgba(11,15,23,0.09)",
          hover: "rgba(11,15,23,0.16)",
          strong: "rgba(11,15,23,0.24)",
          dark: "rgba(255,255,255,0.10)", // hairlines on dark-slate surfaces
          "dark-hover": "rgba(255,255,255,0.18)",
        },
        ink: {
          DEFAULT: "#0B0F17", // Dark Slate as primary text
          secondary: "#4B5264",
          tertiary: "#8A8F9C",
          onDark: "#F4F5F8",
          onDarkSecondary: "#9CA3B4",
        },
        electric: {
          DEFAULT: "#0066FF",
          hover: "#0052D6",
          muted: "rgba(0,102,255,0.10)",
        },
        emerald: {
          DEFAULT: "#00D084",
          hover: "#00B873",
          muted: "rgba(0,208,132,0.12)",
        },
        gold: { DEFAULT: "#C8952E", muted: "rgba(200,149,46,0.12)" }, // VIP seat accent
        warning: { DEFAULT: "#D6820A", muted: "rgba(214,130,10,0.12)" },
        danger: { DEFAULT: "#E5484D", muted: "rgba(229,72,77,0.10)" },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem", letterSpacing: "-0.008em" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem", letterSpacing: "-0.009em" }],
        base: ["0.875rem", { lineHeight: "1.4rem", letterSpacing: "-0.009em" }],
        md: ["0.9375rem", { lineHeight: "1.5rem", letterSpacing: "-0.009em" }],
        lg: ["1.0625rem", { lineHeight: "1.6rem", letterSpacing: "-0.011em" }],
        xl: ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "-0.014em" }],
        "2xl": ["1.75rem", { lineHeight: "2.1rem", letterSpacing: "-0.017em" }],
        "3xl": ["2.5rem", { lineHeight: "2.6rem", letterSpacing: "-0.02em" }],
        "4xl": ["3.5rem", { lineHeight: "3.6rem", letterSpacing: "-0.025em" }],
      },
      borderRadius: {
        sm: "5px",
        DEFAULT: "7px",
        md: "9px",
        lg: "12px",
        xl: "18px", // reserved for the wallet pass + drawer sheet only
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(11,15,23,0.06)",
        crisp: "0 1px 0 rgba(11,15,23,0.04), 0 0 0 1px rgba(11,15,23,0.06)",
        panel: "0 12px 32px -8px rgba(11,15,23,0.16), 0 0 0 1px rgba(11,15,23,0.06)",
        "panel-dark": "0 12px 40px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
        glow: "0 0 0 3px rgba(0,102,255,0.16), 0 2px 8px -2px rgba(0,102,255,0.5)",
        "glow-gold": "0 0 0 3px rgba(200,149,46,0.18), 0 2px 8px -2px rgba(200,149,46,0.45)",
        "glow-emerald": "0 0 0 3px rgba(0,208,132,0.18), 0 2px 8px -2px rgba(0,208,132,0.5)",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(4px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pulse-dot": { "0%,100%": { opacity: "1", transform: "scale(1)" }, "50%": { opacity: "0.5", transform: "scale(0.85)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-up": "fade-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(ellipse 70% 60% at 50% -10%, rgba(0,102,255,0.10), transparent)",
        "dark-grid-fade": "radial-gradient(ellipse 70% 60% at 50% -10%, rgba(0,102,255,0.35), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
