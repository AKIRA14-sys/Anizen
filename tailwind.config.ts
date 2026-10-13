import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0c",
        card: "#121318",
        border: "#20222b",
        primary: {
          DEFAULT: "#ff6b00",
          hover: "#e05e00",
          light: "#ff8533",
          dark: "#cc5200",
        },
        brand: {
          dark: "#0a0a0c",
          surface: "#121318",
          card: "#181a20",
          border: "#232630",
          text: "#f3f4f6",
          muted: "#9ca3af",
          accent: "#ff6b00",
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(255, 107, 0, 0.4)',
        'glow-sm': '0 0 15px -3px rgba(255, 107, 0, 0.3)',
      }
    },
  },
  plugins: [],
};
export default config;
