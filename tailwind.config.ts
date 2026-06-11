import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: "#fbf3f4",
          100: "#f6e3e6",
          200: "#eccbd1",
          300: "#dca6b1",
          400: "#c6748a",
          500: "#ad4f6b",
          600: "#933a57",
          700: "#7a2e49",
          800: "#5e2238",
          900: "#4a1f30",
          950: "#2b0e18",
        },
        cream: "#faf7f2",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
