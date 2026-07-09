/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Support class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#080d1a',       // Deep tech black-blue
          card: '#111827',     // Dark slate card background
          cardHover: '#1f2937',// Slightly lighter slate for card hover
          border: '#1f2937',   // Dark gray border
          primary: '#6366f1',  // Tech Indigo
          primaryHover: '#4f46e5',
          secondary: '#14b8a6',// Teal accent
          secondaryHover: '#0d9488',
          text: '#f3f4f6',     // Off-white text
          textMuted: '#9ca3af',// Gray text
        },
        priority: {
          low: '#10b981',      // Green
          medium: '#3b82f6',   // Blue
          high: '#f59e0b',     // Amber
          critical: '#ef4444', // Red
        },
        type: {
          epic: '#a855f7',     // Purple
          task: '#3b82f6',     // Blue
          subtask: '#06b6d4',  // Cyan
          bug: '#ef4444',      // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(99, 102, 241, 0.15)',
        'glow-secondary': '0 0 15px rgba(20, 184, 166, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      }
    },
  },
  plugins: [],
}
