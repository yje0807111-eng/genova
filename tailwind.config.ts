import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        genova: {
          bg: "#080618",
          card: "#0F0D1E",
          primary: "#534AB7",
          secondary: "#7F77DD",
          text: "#EEEDFE",
          muted: "#AFA9EC",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
    },
  },
};

export default config;
