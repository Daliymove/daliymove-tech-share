import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans SC", ...defaultTheme.fontFamily.sans],
        display: ["Noto Serif SC", "ui-serif", "Georgia", "serif"],
        serif: ["Noto Serif SC", ...defaultTheme.fontFamily.serif],
        mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        // 雾灰松绿：长期阅读时保持低对比、低饱和
        ink: {
          50: "#F8F9F7",
          100: "#F0F2EE",
          200: "#DDE2DB",
          300: "#C3CCC2",
          400: "#78847C",
          500: "#5B675F",
          600: "#47534B",
          700: "#39453D",
          800: "#2C3830",
          900: "#222B25",
          950: "#18201B",
        },
        // 松绿：唯一主强调色
        leaf: {
          50: "#F2F6F1",
          100: "#E2EBE1",
          200: "#C6D8C5",
          300: "#A5C0A3",
          400: "#7FA17E",
          500: "#618A65",
          600: "#4F7A62",
          700: "#3E624E",
          800: "#314E3F",
          900: "#263E32",
        },
        // 暖石色：只承担轻量级辅助层级
        bark: {
          100: "#F1EEE7",
          300: "#DED6C7",
          500: "#A18F70",
          700: "#7A684D",
          900: "#5A4B37",
        },
        // 雾白背景
        paper: {
          50: "#FFFFFF",
          100: "#F5F6F3",
          200: "#E9ECE7",
          300: "#DDE2DB",
        },
        amber: {
          50: "#F8F4E8",
          100: "#F0E4C9",
          300: "#D8BF8B",
          500: "#B38A43",
          700: "#745623",
        },
        coral: {
          100: "#E7F7FA",
          300: "#A9DEEA",
          400: "#6ABFD2",
          600: "#328DA8",
        },
      },
      boxShadow: {
        soft: "0 14px 36px rgba(38, 51, 46, 0.07)",
        lift: "0 20px 52px rgba(38, 51, 46, 0.12)",
        glow: "0 0 0 1px rgba(79, 122, 98, 0.12), 0 18px 42px rgba(38, 51, 46, 0.08)",
      },
    },
  },
  plugins: [],
};
