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
        // Strict Brand Palette: Dark Wine #4D1A22, Cream #FCF1E4, Buttons #64262F / #FCF1E4
        maroon: {
          50: '#FCF1E4',
          100: '#FCF1E4',
          200: '#FCF1E4',
          300: '#FCF1E4',
          400: '#64262F',
          500: '#64262F',
          600: '#64262F',
          700: '#64262F', // Primary Buttons: #64262F
          800: '#64262F', // Darker Button state: #64262F
          900: '#64262F', // Alternate Button surface: #64262F
          950: '#4D1A22', // Dark Wine background & dark text: #4D1A22
        },
        cream: {
          50: '#FCF1E4',
          100: '#FCF1E4', // Cream background & light text: #FCF1E4
          200: '#FCF1E4',
          300: '#FCF1E4',
          400: '#FCF1E4',
          500: '#FCF1E4',
        },
        bakery: {
          50: '#FCF1E4',
          100: '#FCF1E4',
          200: '#FCF1E4',
          300: '#FCF1E4',
          400: '#64262F',
          500: '#64262F',
          600: '#64262F',
          700: '#64262F',
          800: '#64262F',
          900: '#4D1A22',
        },
        charcoal: {
          DEFAULT: '#4D1A22',
          muted: '#4D1A22',
        },
        bakelicious: {
          primary: '#64262F',
          'primary-hover': '#4D1A22',
          'bg-light': '#FCF1E4',
          'bg-light-secondary': '#FCF1E4',
          'bg-dark': '#4D1A22',
          'surface-dark': '#4D1A22',
          'card-dark': '#4D1A22',
          border: '#4D1A22',
          'border-dark': '#FCF1E4',
          text: '#4D1A22',
          'text-muted': '#4D1A22',
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
        'neo-dark': '4px 4px 0px #FCF1E4',
        'neo-cream': '4px 4px 0px #FCF1E4',
        'neo-cream-sm': '2px 2px 0px #FCF1E4',
      }
    },
  },
  plugins: [],
}
