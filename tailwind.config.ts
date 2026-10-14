import type { Config } from "tailwindcss";

// Homiqo brand: Primary #0D5B58 · Accent #FF8A00 · Secondary #4CAF7F · Light #FFF4E6
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E8F3F2",
          100: "#CFE6E4",
          200: "#A3CFCB",
          300: "#6FB1AC",
          400: "#3E8F8A",
          500: "#1C726E",
          600: "#0D5B58",
          700: "#0B4D4A",
          800: "#0A3F3D",
          900: "#08312F",
          950: "#041D1C",
        },
        accent: {
          50: "#FFF4E6",
          100: "#FFE6C7",
          200: "#FFD099",
          400: "#FFA033",
          500: "#FF8A00",
          600: "#E67A00",
          700: "#C26700",
        },
        leaf: { 100: "#DDF1E6", 500: "#4CAF7F", 600: "#3B9468" },
        cream: "#FFF4E6",
        sand: "#F4EEE5",
        paper: "#FAF8F4",
        ink: "#0E2A28",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,42,40,.04), 0 10px 30px -18px rgba(14,42,40,.18)",
        lift: "0 24px 48px -20px rgba(13,91,88,.35)",
        glow: "0 12px 32px -8px rgba(255,138,0,.45)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
        "slide-in": { from: { transform: "translateX(100%)" }, to: { transform: "none" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: {
        "fade-in": "fade-in .5s ease-out both",
        "slide-in": "slide-in .3s cubic-bezier(.2,.8,.2,1) both",
        marquee: "marquee 30s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
