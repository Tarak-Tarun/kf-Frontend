/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // CoastalSeven Brand Colors
        coastal: {
          teal: '#16BAAD',      // Primary Teal
          navy: '#063342',      // Dark Navy
          50:   '#f0fdfb',
          100:  '#ccf0ea',
          200:  '#99e1d5',
          300:  '#66d2c0',
          400:  '#33c3ab',
          500:  '#16BAAD',      // Primary
          600:  '#0fa39f',
          700:  '#0a8f91',
          800:  '#057b83',
          900:  '#063342',      // Dark Navy
        },
        // Primary brand color for Admin (CoastalSeven Teal)
        brand: {
          50:  '#f0fdfb',
          100: '#ccf0ea',
          200: '#99e1d5',
          300: '#66d2c0',
          400: '#33c3ab',
          500: '#16BAAD',       // CoastalSeven Teal
          600: '#0fa39f',
          700: '#0a8f91',
          800: '#057b83',
          900: '#063342',       // CoastalSeven Navy
        },
        // Role-specific accent colors
        admin: {
          50:  '#f0fdfb',
          100: '#ccf0ea',
          500: '#16BAAD',
          600: '#0fa39f',
          700: '#0a8f91',
        },
        intern: {
          50:  '#f8f5ff',
          100: '#f3e8ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        tl: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
