/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-violet": {
          50: "#f3f0ff",
          100: "#ebe5ff",
          200: "#d9ceff",
          300: "#bea6ff",
          400: "#9f75ff",
          500: "#843dff",
          600: "#7916ff",
          700: "#6b04fd",
          800: "#5a03d5",
          900: "#4b05ad",
          950: "#2d0076",
          DEFAULT: "#7916ff",
        },
        "brand-pink": {
          50: "#fff0f9",
          100: "#ffe3f5",
          200: "#ffc6eb",
          300: "#ff98d9",
          400: "#ff58bc",
          500: "#ff2aa2",
          600: "#f50080",
          700: "#d6006b",
          800: "#b10058",
          900: "#93044c",
          950: "#5a0029",
          DEFAULT: "#f50080",
        },
        midnight: {
          50: "#f4f0ff",
          100: "#ede8ff",
          200: "#d8d0ff",
          300: "#b8a9ff",
          400: "#9274ff",
          500: "#6d3aff",
          600: "#5a14ff",
          700: "#4c05f7",
          800: "#3e03cf",
          900: "#1a0050",
          950: "#0d0028",
          DEFAULT: "#080010",
        },
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "neon-glow":
          "linear-gradient(135deg, #7916ff 0%, #f50080 50%, #ff2aa2 100%)",
        "dark-surface":
          "linear-gradient(180deg, #0d0028 0%, #080010 50%, #0a0018 100%)",
      },
      boxShadow: {
        "neon-violet": "0 0 20px rgba(121, 22, 255, 0.5)",
        "neon-pink": "0 0 20px rgba(245, 0, 128, 0.5)",
        "neon-sm": "0 0 8px rgba(121, 22, 255, 0.4)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin 8s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
