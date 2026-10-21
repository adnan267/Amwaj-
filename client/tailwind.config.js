/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        deep: '#061033',
        navy: { DEFAULT: '#0A1F6B', 600: '#13308f', 400: '#3d5bbf' },
        cyan: { DEFAULT: '#00A3E0', 300: '#7FD6FF', 100: '#D6F1FB' },
        foam: '#EEF5F9',
        tile: '#CFE6F0',
        ink: '#0B1430',
        mute: '#4B5675',
        sand: { DEFAULT: '#D8C8A8', 600: '#B9A57E' },
        line: '#D3E0EA',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Figtree Variable"', 'Figtree', 'system-ui', 'sans-serif'],
      },
      maxWidth: { site: '1240px' },
      keyframes: {
        rise: { from: { transform: 'translateY(110%)' }, to: { transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
