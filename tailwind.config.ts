import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sprout: {
          50: "#f0fde8",
          100: "#dcfac6",
          200: "#bbf394",
          300: "#8fe558",
          400: "#68d029",
          500: "#4ab50f",
          600: "#389208",
          700: "#2c720c",
          800: "#265a10",
          900: "#224c12",
        },
        sky2: { 300: "#93d5ff", 400: "#5ab8ff", 500: "#2196f3", 600: "#1565c0" },
        sun: { 300: "#ffe082", 400: "#ffc107", 500: "#ff8f00" },
        coral: { 300: "#ffab91", 400: "#ff7043", 500: "#e64a19" },
        violet: { 300: "#ce93d8", 400: "#ab47bc", 500: "#7b1fa2" },
        ink: { 900: "#1a1a2e", 700: "#2d3142", 500: "#5c607a", 300: "#9da3bd", 100: "#f0f2f8" },
        // Per-subject accent colors
        vocab: { light: "#dcfac6", mid: "#4ab50f", dark: "#266607" },
        concept: { light: "#fff9c4", mid: "#f9a825", dark: "#e65100" },
        reading: { light: "#bbdefb", mid: "#1e88e5", dark: "#0d47a1" },
        english: { light: "#f8bbd9", mid: "#e91e8c", dark: "#880e4f" },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      fontFamily: {
        jua: [
          "'Jua'",
          "'Pretendard Variable'",
          "'Apple SD Gothic Neo'",
          "system-ui",
          "sans-serif",
        ],
        round: [
          "'Nunito'",
          "'Pretendard Variable'",
          "'Apple SD Gothic Neo'",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        kid:   ["1.125rem", { lineHeight: "1.7" }],
        kidlg: ["1.375rem", { lineHeight: "1.5" }],
        kidxl: ["2rem",     { lineHeight: "1.3" }],
        kid2xl:["2.75rem",  { lineHeight: "1.2" }],
      },
      boxShadow: {
        pop:   "0 6px 0 rgba(0,0,0,0.18)",
        popmd: "0 8px 0 rgba(0,0,0,0.18)",
        poplg: "0 10px 0 rgba(0,0,0,0.15)",
        card:  "0 4px 20px rgba(0,0,0,0.09)",
        inner2:"inset 0 2px 8px rgba(0,0,0,0.08)",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-14px)" },
        },
        "float-fast": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-7px)" },
        },
        "pop-in": {
          "0%":   { opacity: "0", transform: "scale(0.7) translateY(12px)" },
          "70%":  { transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-in": {
          "0%":   { transform: "scale(0)" },
          "60%":  { transform: "scale(1.25)" },
          "80%":  { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%":       { transform: "rotate(3deg)" },
        },
        "shine": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%":       { transform: "scale(1.4)", opacity: "0.7" },
        },
      },
      animation: {
        "float-slow":  "float-slow 4s ease-in-out infinite",
        "float-fast":  "float-fast 2.5s ease-in-out infinite",
        "pop-in":      "pop-in 0.4s cubic-bezier(.26,.53,.74,1.48) both",
        "slide-up":    "slide-up 0.5s ease-out both",
        "bounce-in":   "bounce-in 0.5s ease-out both",
        "wiggle":      "wiggle 0.5s ease-in-out",
        "shine":       "shine 2s linear infinite",
        "pulse-dot":   "pulse-dot 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
