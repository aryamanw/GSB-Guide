/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Single warm sans throughout — no display/body pairing.
        // Hierarchy comes from weight and size (see DESIGN.md § Typography).
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Warmed Cardinal — the one accent. Held to ~10% of any screen.
        // Shifted warmer/less saturated than Stanford's institutional #8C1515
        // so it reads human rather than institutional-alert (DESIGN.md § Colors).
        cardinal: {
          50: '#fbf3f1',
          100: '#f6e3de',
          200: '#eec5ba',
          300: '#e2a08e',
          400: '#d07458',
          500: '#bc5738',
          600: '#a0432a',
          700: '#833522',
          800: '#692a1b',
          900: '#532316',
          950: '#2e120b',
        },
        // Warmed Gold — narrow supporting role only, never a second primary.
        gold: {
          50: '#fbf3e4',
          100: '#f5e2be',
          200: '#eacb8c',
          300: '#dcad5c',
          400: '#c8933a',
          500: '#ad7a2c',
          600: '#8f6423',
          700: '#714f1c',
          800: '#573d16',
          900: '#402d10',
        },
      },
    },
  },
  plugins: [],
}
