/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bleu: {
          50: "#eef2ff",
          100: "#e0e7ff",
          400: "#3b5bdb",
          500: "#1e40af",
          600: "#1e3a8a",
          700: "#1a3175",
        },
        rouge: {
          50: "#fef2f2",
          400: "#ef4444",
          500: "#dc2626",
          600: "#b91c1c",
        },
        jaune: {
          50: "#fffbeb",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
        },
        anthracite: {
          50: "#f8f9fb",
          100: "#eef0f4",
          400: "#6b7280",
          600: "#374151",
          700: "#2c2c3a",
          800: "#1f2937",
          900: "#1a1a2e",
        },
      },
    },
  },
  plugins: [],
};
