import type { Config } from "tailwindcss";

// Design language: Linear (dark mode, 1px hairline borders, restrained motion),
// Vercel Dashboard (sharp type, no decorative chrome), Raycast (high contrast,
// fast-feeling surfaces). Tokens are dark-first because every reference here is.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0A0A0B", // page background
        surface: {
          DEFAULT: "#101012", // resting card/panel
          raised: "#17171A", // hovered / popover / modal
          sunken: "#08080A", // inset wells (seat map deck, code blocks)
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          hover: "rgba(255,255,255,0.14)",
          strong: "rgba(255,255,255,0.20)",
        },
        ink: {
          DEFAULT: "#F5F5F6", // primary text
          secondary: "#A0A0A8", // supporting text
          tertiary: "#68686F", // captions, disabled
        },
        accent: {
          DEFAULT: "#5B6EF5", // electric indigo — platform chrome, distinct from any carrier's brand color
          hover: "#6E7FF7",
          muted: "rgba(91,110,245,0.14)",
        },
        positive: { DEFAULT: "#3DD68C", muted: "rgba(61,214,140,0.14)" },
        warning: { DEFAULT: "#F5B84D", muted: "rgba(245,184,77,0.14)" },
        danger: { DEFAULT: "#F5605B", muted: "rgba(245,96,91,0.14)" },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem", letterSpacing: "-0.01em" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem", letterSpacing: "-0.011em" }],
        base: ["0.875rem", { lineHeight: "1.4rem", letterSpacing: "-0.011em" }],
        md: ["0.9375rem", { lineHeight: "1.5rem", letterSpacing: "-0.011em" }],
        lg: ["1.0625rem", { lineHeight: "1.6rem", letterSpacing: "-0.014em" }],
        xl: ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "-0.017em" }],
        "2xl": ["1.75rem", { lineHeight: "2.1rem", letterSpacing: "-0.02em" }],
        "3xl": ["2.5rem", { lineHeight: "2.75rem", letterSpacing: "-0.025em" }],
        "4xl": ["3.5rem", { lineHeight: "3.75rem", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.4)",
        panel: "0 4px 24px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        glow: "0 0 0 1px rgba(91,110,245,0.4), 0 0 24px -4px rgba(91,110,245,0.5)",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(4px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pulse-ring": { "0%": { opacity: "0.6" }, "50%": { opacity: "0.15" }, "100%": { opacity: "0.6" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-up": "fade-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-ring": "pulse-ring 1.8s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91,110,245,0.15), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
