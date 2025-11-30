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
        background: "#090909",
        panel: "#111111",
        border: "#222222",
        accent: {
          cyan: "#00ffff",
          violet: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};
export default config;

