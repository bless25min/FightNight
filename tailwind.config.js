/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#0a0a0f',
        obsidian: '#141420',
        smoke: '#1e1e2e',
        pearl: '#f0f0f5',
        mist: '#8888aa',
        neon: '#bf5af2',
        blaze: '#ff3b5c',
        volt: '#00d4ff',
        gold: '#ffd60a',
      },
      fontFamily: {
        heading: ['Outfit', 'Noto Sans TC', 'sans-serif'],
        body: ['Inter', 'Noto Sans TC', 'sans-serif'],
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(191, 90, 242, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(191, 90, 242, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
