import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Cosmic Void & Stellar Nebula Tokens
        "void-black": "#030712",
        "void-card": "#050814",
        "void-elevated": "#0d1326",
        "nebula-violet": "#8b5cf6",
        "nebula-lavender": "#c4b5fd",
        "pulsar-indigo": "#6366f1",
        "starlight-gold": "#fbbf24",
        "starlight-amber": "#f59e0b",
        "starlight-white": "#f8fafc",
        "starlight-ice": "#e0f2fe",

        // Compatibility Aliases transitioning smoothly from cyber to cosmic
        "slate-dark": "#030712",
        "cyan-focus": "#8b5cf6", // remapped to nebula-violet
        "emerald-highlight": "#10b981",
        "amber-caution": "#fbbf24",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
      animation: {
        "nebula-drift": "nebulaDrift 20s ease-in-out infinite alternate",
        "star-twinkle": "starTwinkle 3s ease-in-out infinite",
        "orbital-slow": "orbitalSlow 35s linear infinite",
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
      },
      keyframes: {
        nebulaDrift: {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-20px, 15px) scale(1.08)" },
          "100%": { transform: "translate(15px, -10px) scale(0.96)" },
        },
        starTwinkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        orbitalSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.85" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
