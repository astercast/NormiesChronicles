/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // light mode
        'l-bg':      '#e8e8e4',
        'l-surface': '#ddddd8',
        'l-border':  '#c8c8c2',
        'l-muted':   '#888880',
        'l-text':    '#2a2a28',
        // dark mode
        'd-bg':      '#141412',
        'd-surface': '#1e1e1c',
        'd-border':  '#2e2e2a',
        'd-muted':   '#666660',
        'd-text':    '#d4d4cc',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': '0.65rem',
      },
    },
  },
  plugins: [],
}
