/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — deep, elegant purple
        brand: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#4c1d75",
        },
        // Secondary — warm pink accent
        accent: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
        sans: ['"Manrope"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #9333ea 0%, #db2777 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)",
        "brand-radial": "radial-gradient(circle at top right, #f3e8ff, transparent 60%)",
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgba(147, 51, 234, 0.35)",
        "glow-lg": "0 20px 60px -15px rgba(147, 51, 234, 0.45)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
