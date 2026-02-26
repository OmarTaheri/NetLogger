/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: '#050505',
          'bg-alt': '#0a0a0a',
          surface: '#141414',
          accent: '#ff6600',
          text: '#e0e0e0',
          'text-dim': '#888888',
          'text-muted': '#555555',
          border: 'rgba(255,255,255,0.10)',
          green: '#00ff88',
          red: '#ff3344',
          yellow: '#ffaa00',
          blue: '#00aaff',
        },
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        tech: ['Rajdhani', 'sans-serif'],
      },
      fontSize: {
        'hud-xs': ['10px', { letterSpacing: '0.1em' }],
        'hud-sm': ['12px', { letterSpacing: '0.05em' }],
      },
      keyframes: {
        'hud-blink': {
          '0%, 10%, 30%, 50%, 70%, 90%': { opacity: '0' },
          '20%, 40%, 60%, 80%, 100%': { opacity: '1' },
        },
        'hud-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'hud-blink': 'hud-blink 0.4s linear forwards',
        'hud-blink-delay-1': 'hud-blink 0.4s 0.2s linear forwards',
        'hud-blink-delay-2': 'hud-blink 0.4s 0.4s linear forwards',
        'hud-blink-delay-3': 'hud-blink 0.4s 0.6s linear forwards',
        'hud-blink-delay-4': 'hud-blink 0.4s 0.8s linear forwards',
        'hud-blink-delay-5': 'hud-blink 0.4s 1.0s linear forwards',
        'hud-blink-delay-6': 'hud-blink 0.4s 1.2s linear forwards',
        'hud-blink-delay-7': 'hud-blink 0.4s 1.4s linear forwards',
        'hud-blink-delay-8': 'hud-blink 0.4s 1.6s linear forwards',
        'hud-pulse': 'hud-pulse 2s ease-in-out infinite',
      },
      boxShadow: {
        'hud-glow': '0 0 15px rgba(255, 102, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
