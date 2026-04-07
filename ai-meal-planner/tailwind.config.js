/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#f8f9ff',
          dark: '#0f1117'
        },
        card: {
          light: '#ffffff',
          dark: '#1a1d27'
        },
        accent: '#6c63ff'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}