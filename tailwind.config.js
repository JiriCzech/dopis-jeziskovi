/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F7F2E7',
        sheet: '#FFFDF8',
        kraft: '#EFE5D1',
        'paper-warm': '#E2D6BE',
        fir: {
          DEFAULT: '#1B4332',
          hover: '#2D6A4F',
          dark: '#133124',
          soft: '#E6EFEA',
        },
        crimson: {
          DEFAULT: '#8E1C1C',
          dark: '#6E1414',
          soft: '#FBEAEA',
        },
        gold: {
          DEFAULT: '#C9963B',
          glow: '#E5BE6B',
          soft: '#F9F0DD',
        },
        'slate-text': {
          DEFAULT: '#1E2421',
          muted: '#4A544E',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        handwritten: ['"Caveat"', 'cursive'],
        fairytale: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -6px rgba(27, 67, 50, 0.12), 0 3px 8px -2px rgba(30, 36, 33, 0.06)',
        paper: '0 16px 44px -10px rgba(27, 67, 50, 0.16), 0 4px 12px -2px rgba(30, 36, 33, 0.08)',
        card: '0 6px 18px -4px rgba(27, 67, 50, 0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translate3d(0, 10px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -5px, 0)' },
        },
      },
    },
  },
  plugins: [],
};
