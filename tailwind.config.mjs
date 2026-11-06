import defaultTheme from "tailwindcss/defaultTheme";

/**
 * Quiet Signal Web implementation tokens.
 * Reference values live in src/styles/global.css; this config only maps
 * semantic roles to utility classes. No external font loading.
 */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "var(--qs-canvas)",
        surface: "var(--qs-surface)",
        sunken: "var(--qs-surface-sunken)",
        ink: {
          primary: "var(--qs-ink-primary)",
          secondary: "var(--qs-ink-secondary)",
          faint: "var(--qs-ink-faint)",
        },
        line: {
          DEFAULT: "var(--qs-line-default)",
          strong: "var(--qs-line-strong)",
        },
        signal: {
          primary: "var(--qs-signal-primary)",
          strong: "var(--qs-signal-strong)",
          soft: "var(--qs-signal-soft)",
          wash: "var(--qs-signal-wash)",
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Songti SC"', "STSong", "SimSun", "Georgia", ...defaultTheme.fontFamily.serif],
        latin: ['"Space Grotesk"', "ui-sans-serif", "system-ui", ...defaultTheme.fontFamily.sans],
        body: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "ui-sans-serif", "system-ui", ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', "Consolas", "ui-monospace", ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        none: "0px",
        sm: "4px",
        DEFAULT: "4px",
        md: "4px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
        "3xl": "4px",
        full: "9999px",
      },
      boxShadow: {
        DEFAULT: "none",
        soft: "none",
        lift: "none",
        glow: "none",
      },
      maxWidth: {
        reading: "44rem",
        page: "72rem",
      },
    },
  },
  plugins: [],
};
