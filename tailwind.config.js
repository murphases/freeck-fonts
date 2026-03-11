/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0f1117",
          secondary: "#161b27",
          tertiary: "#1e2535",
        },
        surface: {
          DEFAULT: "#1e2535",
          hover: "#252d40",
          active: "#2d3650",
        },
        border: {
          DEFAULT: "#2a3347",
          focus: "#4f6ef7",
        },
        primary: {
          DEFAULT: "#4f6ef7",
          hover: "#6b85f8",
          dark: "#3a54e0",
        },
        accent: {
          DEFAULT: "#a855f7",
          hover: "#b46cf8",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        muted: "#8892a4",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
