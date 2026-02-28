/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#111',
        border: '#222',
        dim: '#444',
        muted: '#888',
        primary: '#ccc',
        bright: '#fff',
        accent: '#39ff14',
      },
      fontFamily: {
        pixel: ['VT323', 'monospace'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
