/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        krem: {
          DEFAULT: '#FDFBF7',
          dark: '#F5EFE6',
        },
        coksu: {
          DEFAULT: '#D4A373',
          dark: '#BC8A5F',
        }
      }
    },
  },
  plugins: [],
}