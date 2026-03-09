/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        hand: ['var(--font-caveat)', 'cursive'],
      },
      colors: {
        paper: '#fdf6e3',
        desk: '#f5f0e8',
        ink: {
          DEFAULT: '#3a302a',
          light: '#6b5e50',
          lighter: '#8b7d6b',
          muted: '#a89e8e',
        },
        sketch: {
          DEFAULT: '#c4b89a',
          light: '#d4c9b0',
          dark: '#4a3f35',
        },
      },
    },
  },
  plugins: [],
};
