/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        page: "#221e20",
        header: "#1c191a",
        "panel-dark": "#100f10",
        paper: "#efeeec",
        ink: "#242022",
        "border-dark": "#393337",
        "ink-inverse": "#ece7e3",
        accent: "#c9b9aa",
      },

      fontFamily: {
        sans: ["Manrope", "sans-serif"],
      },
    },
  },

  plugins: [],
};
