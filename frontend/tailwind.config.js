/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          0: '#080808',
          1: '#0e0e0e',
          2: '#141414',
          3: '#1a1a1a',
          4: '#222222',
        },
        ink: {
          primary: '#f0f0f0',
          secondary: '#888888',
          muted: '#555555',
          faint: '#333333',
        },
        dark: {
          bg:     '#080808',
          card:   '#0e0e0e',
          raised: '#141414',
          border: '#1e1e1e',
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.03em',
        tight:    '-0.02em',
        label:    '0.08em',
        caps:     '0.12em',
      },
      animation: {
        'enter':      'enter 0.4s cubic-bezier(0.16,1,0.3,1)',
        'enter-fast': 'enter 0.25s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':    'fade-in 0.3s ease-out',
        'slide-down': 'slide-down 0.25s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':   'slide-up 0.25s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':    'shimmer 1.6s ease-in-out infinite',
        'bid-in':     'bid-in 0.35s cubic-bezier(0.16,1,0.3,1)',
        'gradient-x': 'gradient-x 6s ease infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
      },
      keyframes: {
        'enter': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bid-in': {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 6px rgba(34,211,238,0.12)' },
          '50%':      { boxShadow: '0 0 20px rgba(34,211,238,0.3)' },
        },
      },
    },
  },
  plugins: [],
}
