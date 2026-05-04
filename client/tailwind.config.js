/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#080810',
          900: '#0f0f1a',
          800: '#141420',
          700: '#1a1a2a',
          600: '#1e1e30',
          500: '#252538',
          400: '#2e2e45',
          300: '#3a3a55',
        },
        brand: {
          DEFAULT: '#f97316',
          light: '#fb923c',
          dark: '#ea580c',
        },
      },
    },
  },
  plugins: [],
};
