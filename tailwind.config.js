/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // UNO suit colors, tuned a touch richer than the classic deck.
        uno: {
          red: "#e4342f",
          green: "#3aa856",
          blue: "#2a7de1",
          yellow: "#f4c542",
          wild: "#1b1b1f",
        },
      },
      fontFamily: {
        display: ['"Segoe UI"', "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
