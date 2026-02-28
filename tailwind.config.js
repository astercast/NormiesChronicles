/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'grid-bg': '#0a0a0a',
        'grid-surface': '#111111',
        'grid-border': '#2a2a2a',
        'grid-primary': '#48494b',
        'grid-secondary': '#e3e5e4',
        'grid-accent': '#39ff14',
        'grid-accent-dim': '#1a7a08',
      },
      fontFamily: {
        pixel: ['VT323', 'monospace'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
