/** @type {import('tailwindcss').Config} */
export default {
  // Scan every file under src/ that can contain Tailwind classes
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Enable class-based dark mode (toggled via <html class="dark">)
  darkMode: "class",

  theme: {
    extend: {
      // OmniSocial brand colours — match the violet/pink gradient in the app
      colors: {
        brand: {
          violet: "#7c3aed", // violet-600
          pink:   "#ec4899", // pink-500
        },
      },

      // Smooth spring-like transitions used alongside Framer Motion
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      // Clamp-based fluid typography (optional utility)
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },

      // Custom animation for the story ring gradient
      animation: {
        "gradient-spin": "gradient-spin 3s linear infinite",
      },
      keyframes: {
        "gradient-spin": {
          "0%":   { backgroundPosition: "0% 50%"   },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%"   },
        },
      },
    },
  },

  plugins: [
    // Hides scrollbars while keeping scrollability (used in StoryBar)
    // Install with: npm i -D tailwind-scrollbar-hide
    // require("tailwind-scrollbar-hide"),
  ],
};
