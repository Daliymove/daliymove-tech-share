import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", ...defaultTheme.fontFamily.sans],
        serif: ["Literata", "Noto Serif SC", ...defaultTheme.fontFamily.serif],
      },
      colors: {
        ink: {
          50: "#f8fafc",
          100: "#eef2f7",
          200: "#d7e0ea",
          300: "#b4c2d4",
          400: "#879bb4",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#070b14",
        },
        leaf: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          900: "#134e4a",
        },
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          300: "#fcd34d",
          500: "#f59e0b",
          700: "#b45309",
        },
        coral: {
          100: "#ffe4e6",
          400: "#fb7185",
          600: "#e11d48",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
        lift: "0 24px 70px rgba(15, 23, 42, 0.14)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.12), 0 22px 55px rgba(15, 118, 110, 0.16)",
      },
    },
  },
  plugins: [],
};
