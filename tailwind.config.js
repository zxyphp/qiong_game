/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        starlight: {
          950: '#0b0820',
          900: '#161030',
          800: '#211848',
          700: '#32236b',
          400: '#b794f6',
          300: '#d8b4fe',
          200: '#f5d0fe',
        },
        petal: {
          pink: '#ff85c0',
          gold: '#ffd666',
          cyan: '#5cdbd3',
          violet: '#b37feb',
          coral: '#ff7875',
          emerald: '#73d13d',
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Songti SC"', '"STSong"', 'Georgia', 'serif'],
        sans: [
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 24px rgba(216, 180, 254, 0.35)',
        'glow-pink': '0 0 28px rgba(255, 133, 192, 0.45)',
        'glow-gold': '0 0 24px rgba(255, 214, 102, 0.45)',
        glass: '0 8px 32px rgba(10, 6, 30, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.9)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'float-slow': 'floatSlow 4s ease-in-out infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        shimmer: 'shimmer 4s linear infinite',
      },
    },
  },
  plugins: [],
};
