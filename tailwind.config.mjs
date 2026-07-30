import defaultTheme from "tailwindcss/defaultTheme";

const cssColor = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;
const palette = (name, shades) => Object.fromEntries(shades.map((shade) => [shade, cssColor(`${name}-${shade}`)]));

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Prefer locally available CJK-capable system fonts. This keeps first
        // paint independent of Google Fonts in mainland China.
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "PingFang SC", "Microsoft YaHei", ...defaultTheme.fontFamily.sans],
        display: ["ui-serif", "Songti SC", "STSong", "SimSun", "Georgia", "serif"],
        serif: ["ui-serif", "Songti SC", "STSong", "SimSun", ...defaultTheme.fontFamily.serif],
        mono: ["ui-monospace", "SFMono-Regular", "Cascadia Code", "Consolas", ...defaultTheme.fontFamily.mono],
      },
      // Palette values are CSS variables so the same utility classes can use
      // the site's warm palette in light mode and neutral grays in dark mode.
      colors: {
        ink: palette("ink", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        leaf: palette("leaf", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        bark: palette("bark", [100, 300, 500, 700, 900]),
        paper: palette("paper", [50, 100, 200, 300]),
        amber: palette("amber", [50, 100, 200, 300, 500, 700, 800]),
        coral: palette("coral", [100, 300, 400, 600]),
      },
      boxShadow: {
        soft: "0 14px 36px rgb(0 0 0 / 0.07)",
        lift: "0 20px 52px rgb(0 0 0 / 0.12)",
        glow: "0 0 0 1px rgb(0 0 0 / 0.12), 0 18px 42px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};
