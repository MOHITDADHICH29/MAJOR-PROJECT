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
        dark: {
          900: '#070A12',
          800: '#0B0F19',
          700: '#111827',
          600: '#1F2937',
          500: '#374151',
        },
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          glow: 'rgba(6, 182, 212, 0.25)',
        },
        violet: {
          400: '#A78BFA',
          500: '#8B5CF6',
          glow: 'rgba(139, 92, 246, 0.25)',
        },
        emerald: {
          400: '#34D399',
          500: '#10B981',
          glow: 'rgba(16, 185, 129, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.3)',
        'glow-violet': '0 0 20px -3px rgba(139, 92, 246, 0.3)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}
