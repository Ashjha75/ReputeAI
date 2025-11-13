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
      },
      animation: {
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'float-slow': 'float-slow 20s ease-in-out infinite',
        'float-medium': 'float-medium 15s ease-in-out infinite',
        'float-fast': 'float-fast 10s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'gradient-text': 'gradient-text 5s ease infinite',
        'typewriter': 'typewriter 3s steps(30) 1s forwards'
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        },
        'pulse-glow': {
          '0%, 100%': { 
            'box-shadow': '0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(147, 51, 234, 0.3), 0 0 60px rgba(147, 51, 234, 0.1)'
          },
          '50%': { 
            'box-shadow': '0 0 30px rgba(147, 51, 234, 0.7), 0 0 60px rgba(147, 51, 234, 0.5), 0 0 90px rgba(147, 51, 234, 0.3)'
          }
        },
        'gradient-text': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    }
  },
  plugins: [],
}
