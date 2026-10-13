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
        // Official Bakelicious Brand Palette: Primary Burgundy #7A1F35, Banner #64262F, Top Layer #FCF1E4
        maroon: {
          50: '#FBF5EB',
          100: '#FCF1E4', // Top Layer & Light Background #FCF1E4
          200: '#FFF9F2', // Light Cards / Soft Cream
          300: '#EEDCC8', // Soft Beige Borders
          400: '#B85669',
          500: '#942D42',
          600: '#852439',
          700: '#7A1F35', // Brand Accent, Headings & Order Buttons #7A1F35
          800: '#6C212E',
          900: '#64262F', // Brand Signature Banner Maroon #64262F
          950: '#4D1A22', // Deep Wine Contour
        },
        cream: {
          50: '#FFFFFF',
          100: '#FCF1E4', // Exact Top Layer Color #FCF1E4
          200: '#FFF9F2', // Light Secondary Background / Cards
          300: '#EEDCC8', // Soft Beige Borders
          400: '#E5D3BF',
          500: '#D4BD9E',
        },
        bakery: {
          50: '#FBF5EB',
          100: '#FCF1E4',
          200: '#FFF9F2',
          300: '#EEDCC8',
          400: '#D97706',
          500: '#942D42',
          600: '#852439',
          700: '#7A1F35',
          800: '#6C212E',
          900: '#64262F',
        },
        charcoal: {
          DEFAULT: '#2D2020',
          muted: '#6E5D5F',
        },
        bakelicious: {
          primary: '#7A1F35',
          'primary-hover': '#64262F',
          'bg-light': '#FCF1E4',
          'bg-light-secondary': '#FFF9F2',
          'bg-dark': '#4D1A22',
          'surface-dark': '#64262F',
          'card-dark': '#7A1F35',
          border: '#EEDCC8',
          'border-dark': '#8B2C40',
          text: '#2D2020',
          'text-muted': '#6E5D5F',
          cream: '#FCF1E4',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px #4D1A22',
        'neo': '4px 4px 0px #4D1A22',
        'neo-md': '5px 5px 0px #4D1A22',
        'neo-lg': '7px 7px 0px #4D1A22',
        'neo-xl': '10px 10px 0px #4D1A22',
        'neo-dark': '4px 4px 0px #2E0F14',
        'neo-cream': '4px 4px 0px #FCF1E4',
        'neo-cream-sm': '2px 2px 0px #FCF1E4',
      }
    },
  },
  plugins: [],
}
