/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        michroma: ['Michroma', 'sans-serif'],
      },
      colors: {
        // ── Legacy brand tokens (log viewer) ──────────────────────────
        brand: {
          bg: '#0B0F1A',
          primary: '#4338ca',
          secondary: '#06b6d4',
        },
        // ── Dashboard theme tokens ─────────────────────────────────────
        dash: {
          bg:        '#0D0B14',  // Dark Background
          surface:   '#15101F',  // Dark Surface
          card:      '#1C1628',  // Dark Card
          border:    '#2D2D5E',  // Border Color
          primary:   '#7B6FE0',  // Primary Purple
          light:     '#9B8FF0',  // Light Purple
          text:      '#FFFFFF',  // Text Primary
          muted:     '#555577',  // Text Muted
          error:     '#E5484D',  // Error Red
          warning:   '#F0A500',  // Warning Amber
          success:   '#4CAF50',  // Success Green
          info:      '#4A9EFF',  // Info Blue
          fatal:     '#9B1C1C',  // Fatal Dark Red
        },
      },
      animation: {
        shimmer:          "shimmer 2s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "spin-once":      "spin-once 0.6s ease-in-out",
        "pulse-dot":      "pulse-dot 1.5s ease-in-out infinite",
        "fade-up":        "fade-up 0.5s ease-out forwards",
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to:   { backgroundPosition: "-200% 0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "spin-once": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.4", transform: "scale(0.75)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
