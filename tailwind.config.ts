import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        spraystone: {
          cream: '#F5F1E8',
          beige: '#E8DCC8',
          brown: '#2D2A26',
          tan: '#6B5E4F',
          gold: '#D4A574',
          'gold-dark': '#C4955E',
        },
      },
      animation: {
        'fade-in-modern': 'fadeInModern 0.4s ease-out forwards',
      },
      keyframes: {
        fadeInModern: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
} satisfies Config;
