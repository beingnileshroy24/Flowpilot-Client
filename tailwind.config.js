/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === PRIMARY: Warm Amber-Yellow (50% usage) ===
        yellow: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // === SECONDARY: Ocean Blue (20% usage) ===
        blue: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // === SURFACES: Light Mode ===
        light: {
          bg:       '#f8fafc',      // Soft white page background
          surface:  '#ffffff',      // Pure white card surface
          elevated: '#f1f5f9',      // Slightly off-white elevated surface
          border:   'rgba(0,0,0,0.07)',
          text:     '#0f172a',      // Near-black heading text
          textMuted:'#64748b',      // Muted slate text
        },
        // === SURFACES: Dark Mode ===
        dark: {
          bg:       '#0a0a0f',      // Deep charcoal page background
          surface:  '#111118',      // Dark card surface
          elevated: '#1a1a24',      // Slightly lighter elevated
          border:   'rgba(255,255,255,0.07)',
          text:     '#f1f5f9',      // Off-white heading text
          textMuted:'#94a3b8',      // Muted slate-blue text
        },
        // === SEMANTIC COLORS ===
        priority: {
          low:      '#22c55e',   // Green
          medium:   '#3b82f6',   // Blue
          high:     '#f59e0b',   // Amber
          critical: '#ef4444',   // Red
        },
        type: {
          epic:    '#a855f7',   // Purple
          task:    '#3b82f6',   // Blue
          subtask: '#06b6d4',   // Cyan
          bug:     '#ef4444',   // Red
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
        '5xl': '2rem',
      },
      boxShadow: {
        // Light mode shadows
        'glass-sm':  '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'glass':     '0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        'glass-lg':  '0 20px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
        // Yellow glow
        'glow-yellow': '0 0 24px rgba(245,158,11,0.25), 0 0 48px rgba(245,158,11,0.10)',
        'glow-yellow-sm': '0 0 12px rgba(245,158,11,0.20)',
        // Blue glow
        'glow-blue': '0 0 24px rgba(59,130,246,0.25)',
        // Dark mode shadows
        'dark-glass':    '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
        'dark-glass-lg': '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
        // Card elevation
        'card-hover': '0 16px 40px rgba(0,0,0,0.12)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(245,158,11,0.2)' },
          '50%':       { boxShadow: '0 0 28px rgba(245,158,11,0.5)' },
        },
        'orb-float': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%':       { transform: 'translateY(-20px) scale(1.04)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to':   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':   'fade-in 0.2s ease-out',
        'slide-up':  'slide-up 0.25s ease-out',
        'scale-in':  'scale-in 0.2s ease-out',
        'glow-pulse':'glow-pulse 2.5s ease-in-out infinite',
        'orb-float': 'orb-float 6s ease-in-out infinite',
        'shimmer':   'shimmer 2s linear infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
