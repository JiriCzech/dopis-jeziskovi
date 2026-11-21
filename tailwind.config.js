/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F6F1E7',
        sheet: '#FFFDF9',
        'paper-warm': '#E6DEC8',
        fir: {
          DEFAULT: '#234B3E',
          dark: '#19382E',
          soft: '#E3EFEA',
        },
        crimson: {
          DEFAULT: '#B23A3A',
          dark: '#8F2B2B',
          soft: '#FCEAEA',
        },
        gold: {
          DEFAULT: '#C89646',
          soft: '#F9F0DD',
        },
        'slate-text': {
          DEFAULT: '#242826',
          muted: '#525A56',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        handwritten: ['"Caveat"', 'cursive'],
        fairytale: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 34px -8px rgba(36, 40, 38, 0.09)',
        paper: '0 14px 44px -10px rgba(36, 40, 38, 0.11), 0 2px 10px -2px rgba(36, 40, 38, 0.05)',
        card: '0 4px 16px -3px rgba(35, 75, 62, 0.07)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out forwards',
        'slide-up': 'slideUp 0.35s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
