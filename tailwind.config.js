/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de colores Ocean Theme
        'bondi-blue': '#0799b6',      // Azul vibrante medio-azul verdoso
        'san-marino': '#4a6eb0',      // Azul medio apagado, hacia periwinkle
        'eden': '#114c5f',            // Verde azulado oscuro profundo
        'sinbad': '#9cd2d3',          // Azul verdoso muy claro o menta
        'janna': '#f2e6cf',           // Crema o beige muy claro suave
        
        // Variaciones de la paleta principal
        'bondi': {
          50: '#e6f7fb',
          100: '#b8e9f4',
          200: '#8adbeb',
          300: '#5ccde2',
          400: '#2ebfd9',
          500: '#0799b6',  // bondi-blue principal
          600: '#067a93',
          700: '#055b70',
          800: '#043c4d',
          900: '#021d2a',
        },
        'marino': {
          50: '#f0f4fc',
          100: '#d9e3f6',
          200: '#c2d2f0',
          300: '#abc1ea',
          400: '#94b0e4',
          500: '#4a6eb0',  // san-marino principal
          600: '#3c5790',
          700: '#2e4070',
          800: '#202950',
          900: '#121230',
        },
        'eden': {
          50: '#e8f2f5',
          100: '#c5dee6',
          200: '#a2cad7',
          300: '#7fb6c8',
          400: '#5ca2b9',
          500: '#114c5f',  // eden principal
          600: '#0e3d4c',
          700: '#0b2e39',
          800: '#081f26',
          900: '#051013',
        },
        'sinbad': {
          50: '#f7fcfc',
          100: '#eaf6f6',
          200: '#ddf0f0',
          300: '#d0eaea',
          400: '#c3e4e4',
          500: '#9cd2d3',  // sinbad principal
          600: '#7da8a9',
          700: '#5e7e7f',
          800: '#3f5455',
          900: '#202a2b',
        },
        'janna': {
          50: '#fdfcfa',
          100: '#faf6f2',
          200: '#f7f0ea',
          300: '#f4eae2',
          400: '#f7e8d5',
          500: '#f2e6cf',  // janna principal
          600: '#c2b8a5',
          700: '#928a7b',
          800: '#625c51',
          900: '#322e27',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
