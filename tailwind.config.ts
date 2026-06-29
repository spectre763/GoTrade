/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#111113",
        card: "#18181b",
        "card-hover": "#1c1c1f",
        border: "#27272a",
        "border-subtle": "#1e1e20",
        primary: {
          DEFAULT: "#10b981",
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          glow: "rgba(16, 185, 129, 0.15)",
        },
        secondary: {
          DEFAULT: "#8b5cf6",
          500: "#8b5cf6",
          600: "#7c3aed",
          glow: "rgba(139, 92, 246, 0.15)",
        },
        profit: "#10b981",
        "profit-muted": "rgba(16, 185, 129, 0.12)",
        loss: "#f43f5e",
        "loss-muted": "rgba(244, 63, 94, 0.12)",
        muted: "#71717a",
        subtle: "#3f3f46",
        accent: "#facc15",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-hero":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.15), transparent)",
        "gradient-glow":
          "radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
      },
      animation: {
        "ticker-scroll": "ticker-scroll 40s linear infinite",
        "fade-up": "fade-up 0.6s ease forwards",
        "fade-in": "fade-in 0.4s ease forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "counter": "counter 2s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(16, 185, 129, 0.25)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px rgba(16, 185, 129, 0.12)",
        "glow-md": "0 0 30px rgba(16, 185, 129, 0.18)",
        "glow-lg": "0 0 60px rgba(16, 185, 129, 0.22)",
        "card": "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
