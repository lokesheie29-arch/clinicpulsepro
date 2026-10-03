/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5f9',
          100: '#e1ebf2',
          200: '#c7dae6',
          300: '#9ec0d4',
          400: '#6f9ebe',
          500: '#4e82a6',
          600: '#3d688a',
          700: '#325471',
          800: '#0F4C81',
          900: '#0A2540',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0D9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#00A896',
        }
      }
    },
  },
  plugins: [],
};
