/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Bright Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#84cc16', // Vibrant Green
          600: '#56AF12', // Darker logo green
          700: '#16a34a',
          800: '#166534',
          900: '#14532d',
        },
        brand: {
          navy: '#1e3a8a', // Navy Blue
          blue: {
            light: '#006BA3', // Logo blue
            dark: '#003E76', // Darker logo blue
            bright: '#0ea5e9', // Bright Blue
          },
          green: {
            light: '#6EC31C', // Logo green
            dark: '#56AF12', // Darker logo green
            vibrant: '#84cc16', // Vibrant Green
          }
        }
      }
    },
  },
  plugins: [],
}