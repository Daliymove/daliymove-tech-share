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
        // 暖墨：文字与深色面，深浅两用（浅底用 400+，深底用 50-300）
        ink: {
          50: "#FAF9F6",
          100: "#F2EFE9",
          200: "#E4DED3",
          300: "#C9C0B1",
          400: "#6F6657",
          500: "#574E42",
          600: "#433B31",
          700: "#322C24",
          800: "#221D18",
          900: "#16120E",
          950: "#0F0C09",
        },
        // 森林绿 / moss：原 leaf 令牌，重定义为有机手账主色
        leaf: {
          50: "#EDF3EA",
          100: "#D9E6D2",
          200: "#B8D2AC",
          300: "#8FB889",
          400: "#6FA06A",
          500: "#4F7A52",
          600: "#3A5C3E",
          700: "#2F4C33",
          800: "#253C29",
          900: "#1B2D1E",
        },
        // 暖木色 / bark：辅色点缀
        bark: {
          100: "#F1E6D6",
          300: "#C99A6A",
          500: "#9A6B3F",
          700: "#7F5539",
          900: "#4F3520",
        },
        // 纸感米白 / paper：背景层级
        paper: {
          50: "#FBF8F1",
          100: "#F7F3EA",
          200: "#EFE9DC",
          300: "#E4DBCB",
        },
        amber: {
          50: "#FFFBEb",
          100: "#FEF3C7",
          300: "#FCD34D",
          500: "#F59E0B",
          700: "#B45309",
        },
        // 陶土色 / clay：原 coral，重定义为暖陶，避免粉色冲突
        coral: {
          100: "#F3E3D3",
          300: "#DCB089",
          400: "#C9915C",
          600: "#A9683A",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(35,43,34,0.08)",
        lift: "0 24px 70px rgba(35,43,34,0.14)",
        glow: "0 0 0 1px rgba(79,122,82,0.14), 0 22px 55px rgba(58,92,62,0.14)",
      },
    },
  },
  plugins: [],
};
