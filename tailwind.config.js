/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "poke-red": "#FF0000",
        "poke-white": "#FFFFFF",
        "poke-black": "#333333",
        "primary": "#FF0000",
      },
      fontFamily: {
        "display": ["Spline Sans", "PingFang SC", "Microsoft YaHei", "sans-serif"]
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}

