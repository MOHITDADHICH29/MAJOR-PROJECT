/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#FAFCFB',
        panel: {
          DEFAULT: '#DCE9E6',
          light: '#E8F1EF',
          alt: '#C9D6D3',
          dark: '#B9EDE6',
          mint: '#EBF5F3',
        },
        forest: {
          DEFAULT: '#1F4D45',
          dark: '#14352F',
          light: '#2A665C',
          muted: '#28584F',
        },
        deep: {
          DEFAULT: '#557A74',
          hover: '#476862',
          dark: '#3D5954',
        },
        body: {
          DEFAULT: '#3A4A47',
          dark: '#263331',
          light: '#536360',
        },
        muted: {
          DEFAULT: '#7A8A87',
          light: '#A2B0AD',
          dark: '#5C6C69',
        },
        border: {
          DEFAULT: '#D5E2DF',
          subtle: '#E6EFECE',
          strong: '#BCCFCB',
        },
        lime: {
          DEFAULT: '#7CFF3F',
          soft: 'rgba(124, 255, 63, 0.4)',
        },
        healthy: {
          DEFAULT: '#2E9E73',
          light: '#E3F6EE',
        },
        eeg: {
          DEFAULT: '#1F4D45',
          active: '#2E9E73',
          light: '#EBF4F1',
        },
        mri: {
          DEFAULT: '#4F6D8F',
          light: '#EDF3F8',
          dark: '#3B536E',
        },
        warning: {
          DEFAULT: '#D99A2B',
          light: '#FDF6E8',
        },
        risk: {
          DEFAULT: '#C8475A',
          light: '#FBEDF0',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '6px',
        panel: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(31, 77, 69, 0.05)',
        'card-hover': '0 4px 12px rgba(31, 77, 69, 0.08)',
        modal: '0 12px 36px -4px rgba(31, 77, 69, 0.16)',
        'lime-glow': '0 0 10px rgba(124, 255, 63, 0.35)',
      },
      backgroundImage: {
        'mint-band': 'linear-gradient(90deg, #8FD9CF, #B9EDE6)',
        'soft-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 100%)',
      }
    },
  },
  plugins: [],
}
