module.exports = {
  content: [
    "./src/**/*.{html,ts,css,scss}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          50: '#ebf3ff',
          100: '#dbe9ff',
          200: '#bcd7ff',
          300: '#9cc3ff',
          400: '#6fa8ff',
          500: '#3f8fff',
          600: '#2563eb',
          700: '#1a4db4',
          800: '#133a88',
          900: '#0b2658'
        },
        secondary: {
          DEFAULT: '#10b981' // emerald-500
        },
        accent: {
          DEFAULT: '#8b5cf6' // violet-500
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: [],
}
