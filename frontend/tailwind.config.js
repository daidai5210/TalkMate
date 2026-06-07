/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        app: {
          surface: 'var(--bg-primary)',
          muted: 'var(--bg-secondary)',
          border: 'var(--border-default)',
          text: 'var(--text-primary)',
          'text-muted': 'var(--text-tertiary)',
        },
        immersive: {
          base: 'var(--immersive-bg-base)',
          text: 'var(--immersive-text-primary)',
          'text-muted': 'var(--immersive-text-tertiary)',
          glass: 'var(--immersive-surface-glass)',
          overlay: 'var(--immersive-overlay)',
        },
      },
      borderRadius: {
        app: 'var(--primitive-radius-lg)',
        sheet: 'var(--primitive-radius-xl)',
      },
      backgroundImage: {
        'immersive-gradient':
          'linear-gradient(165deg, var(--immersive-bg-gradient-from) 0%, var(--immersive-bg-gradient-via) 45%, var(--immersive-bg-gradient-to) 100%)',
        'auth-gradient':
          'linear-gradient(180deg, var(--primitive-slate-900) 0%, var(--primitive-brand-950) 55%, var(--primitive-brand-900) 100%)',
      },
      maxWidth: {
        app: 'var(--app-max-width)',
      },
      spacing: {
        'bottom-nav': 'var(--app-bottom-nav-height)',
        'safe-top': 'var(--app-safe-top)',
        'safe-bottom': 'var(--app-safe-bottom)',
      },
      minHeight: {
        touch: '48px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        brand: 'var(--shadow-brand)',
        card: 'var(--shadow-md)',
        'card-hover': 'var(--shadow-lg)',
        immersive: 'var(--shadow-immersive)',
        'immersive-glow': 'var(--shadow-immersive-glow)',
        sheet: 'var(--shadow-sheet)',
        'app-shell': '0 0 0 1px rgba(15, 23, 42, 0.06), 0 12px 40px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
