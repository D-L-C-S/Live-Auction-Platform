/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg:      '#0d0d14',
          card:    '#161622',
          raised:  '#1e1e2e',
          border:  '#2a2a3d',
        },
      },
      animation: {
        'gradient-x':   'gradient-x 6s ease infinite',
        'pulse-glow':   'pulse-glow 2.5s ease-in-out infinite',
        'slide-down':   'slide-down 0.25s ease-out',
        'fade-in':      'fade-in 0.3s ease-out',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 6px rgba(139,92,246,0.25)' },
          '50%':      { boxShadow: '0 0 22px rgba(139,92,246,0.55)' },
        },
        'slide-down': {
          '0%':   { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
