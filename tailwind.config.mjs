import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "Noto Sans SC", ...defaultTheme.fontFamily.sans],
        display: ["Fraunces", "Noto Serif SC", "ui-serif", "Georgia", "serif"],
        serif: ["Noto Serif SC", "Fraunces", ...defaultTheme.fontFamily.serif],
        mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        // 冷墨色：清晰、克制的蓝灰文字与深色面
        ink: {
          50: "#F7FCFC",
          100: "#EDF7F8",
          200: "#D5E7EA",
          300: "#B6D0D6",
          400: "#6C8790",
          500: "#52717B",
          600: "#3E5B66",
          700: "#2C4652",
          800: "#203943",
          900: "#172D37",
          950: "#10242D",
        },
        // 薄荷青绿：与站点图标主色一致
        leaf: {
          50: "#EDFDFC",
          100: "#D4F7F3",
          200: "#A9EDE4",
          300: "#77DED2",
          400: "#45C9BC",
          500: "#2FAE9B",
          600: "#218A84",
          700: "#176A6D",
          800: "#12545B",
          900: "#0E3E48",
        },
        // 天空蓝：作为第二强调色替代旧暖木色
        bark: {
          100: "#E5F2FD",
          300: "#A8D6F5",
          500: "#4A9FE8",
          700: "#2877C7",
          900: "#174E91",
        },
        // 冰感浅色背景
        paper: {
          50: "#FCFEFE",
          100: "#F4FBFB",
          200: "#EAF6F7",
          300: "#D7EAED",
        },
        amber: {
          50: "#FEFEE9",
          100: "#F5F8C9",
          300: "#EAF9AE",
          500: "#BEDC5B",
          700: "#677E1B",
        },
        coral: {
          100: "#E7F7FA",
          300: "#A9DEEA",
          400: "#6ABFD2",
          600: "#328DA8",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(31, 87, 104, 0.08)",
        lift: "0 24px 70px rgba(31, 87, 104, 0.14)",
        glow: "0 0 0 1px rgba(47, 174, 155, 0.16), 0 22px 55px rgba(74, 159, 232, 0.16)",
      },
    },
  },
  plugins: [],
};
