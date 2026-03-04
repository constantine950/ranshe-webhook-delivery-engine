/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f3d0fe',
          300: '#e9a8fd',
          400: '#d870fa',
          500: '#c13df0',
          600: '#a21bcf',
          700: '#8616aa',
          800: '#6f168a',
          900: '#5c1870',
        },
      },
    },
  },
  plugins: [],
}
