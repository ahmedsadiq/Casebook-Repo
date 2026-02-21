import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          50:  "#f0f3ff",
          100: "#e0e8ff",
          200: "#c0d0ff",
          300: "#93adff",
          400: "#587eff",
          500: "#3358f4",
          600: "#2140e8",
          700: "#1a31cc",
          800: "#1829a5",
          900: "#1a2882",
          950: "#111850",
        },
      },
      boxShadow: {
        card:    "0 1px 3px rgba(15,23,42,0.07), 0 1px 2px rgba(15,23,42,0.04)",
        "card-md":"0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
