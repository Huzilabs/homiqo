import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effaf6",
          100: "#d8f3e8",
          200: "#b3e6d3",
          300: "#80d2b8",
          400: "#4bb798",
          500: "#299c7e",
          600: "#1b7d66",
          700: "#176454",
          800: "#155045",
          900: "#13423a",
          950: "#082520",
        },
        accent: {
          50: "#fff6ed",
          100: "#ffead4",
          400: "#ff9a4d",
          500: "#fb7a1f",
          600: "#ec5f0b",
        },
        ink: "#0f1a17",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)",
        lift: "0 10px 30px -10px rgba(16,24,40,.18)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        "slide-in": { from: { transform: "translateX(100%)" }, to: { transform: "none" } },
      },
      animation: {
        "fade-in": "fade-in .35s ease-out both",
        "slide-in": "slide-in .3s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
