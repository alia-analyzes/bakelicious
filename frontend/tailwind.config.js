/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Official Bakelicious Brand Palette: Primary #7E4049, Light BG #FCF1E3
        maroon: {
          50: '#FAF0E6',
          100: '#FCF1E3', // Light Main Background #FCF1E3
          200: '#FFF9F2', // Light Cards / Soft Cream
          300: '#EEDCC8', // Soft Beige Borders
          400: '#B56C77',
          500: '#964F59',
          600: '#7E4049', // Primary Brand Maroon / Rose #7E4049
          700: '#68343D', // Dark Theme Cards / Primary Hover
          800: '#5A2D34', // Dark Theme Secondary Surface
          900: '#4A252B', // Dark Theme Main Background #4A252B
          950: '#381A20',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FCF1E3', // Light Theme Main Background #FCF1E3
          200: '#FFF9F2', // Light Theme Secondary Background / Cards #FFF9F2
          300: '#EEDCC8', // Soft Beige Borders
          400: '#E5D3BF',
          500: '#D4BD9E',
        },
        bakery: {
          50: '#FAF0E6',
          100: '#FCF1E3',
          200: '#FFF9F2',
          300: '#EEDCC8',
          400: '#D97706',
          500: '#964F59',
          600: '#7E4049',
          700: '#68343D',
          800: '#5A2D34',
          900: '#4A252B',
        },
        charcoal: {
          DEFAULT: '#2D2020',
          muted: '#6E5D5F',
        },
        bakelicious: {
          primary: '#7E4049',
          'primary-hover': '#68343D',
          'bg-light': '#FCF1E3',
          'bg-light-secondary': '#FFF9F2',
          'bg-dark': '#4A252B',
          'surface-dark': '#5A2D34',
          'card-dark': '#68343D',
          border: '#EEDCC8',
          'border-dark': '#7A3F49',
          text: '#2D2020',
          'text-muted': '#6E5D5F',
          cream: '#FCF1E3',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
