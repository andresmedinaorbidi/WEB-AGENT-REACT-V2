/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'plinng-green': '#beff50',
        'plinng-purple': '#60259f',
        'plinng-dark': '#1a1a1a', // Soft black for text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Make sure you use a clean font
      }
    },
  },
  plugins: [],
}