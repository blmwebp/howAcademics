/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // HowAcademics brand palette (inspired by reference)
        page: '#221e20',
        header: '#1c191a',
        'ink-inverse': '#cdc5bd',
        paper: '#efeeec',
        ink: '#242022',
        'panel-dark': '#100f10',
        'border-dark': '#393337',
        accent: '#c9b9aa',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      maxWidth: {
        content: '1440px',
      },
      spacing: {
        'side-gutter': 'clamp(20px, 5.8vw, 90px)',
      },
      fontSize: {
        'hero-clamp': 'clamp(2.5rem, 5.8vw, 5rem)',
      },
    },
  },
  plugins: [],
};
