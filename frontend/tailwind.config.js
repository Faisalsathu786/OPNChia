/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED",
        secondary: "#10B981",
        danger: "#EF4444",
        dark: "#0F172A",
        card: "#1E293B",
      },
    },
  },
  plugins: [],
};
