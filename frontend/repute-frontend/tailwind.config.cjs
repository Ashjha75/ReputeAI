// File: tailwind.config.js

module.exports = {
  // 1. Content: Keep existing content paths
  content: [
    "./src/**/*.{html,ts,css,scss}"
  ],
  theme: {
    extend: {
      colors: {
        // 2. PRIMARY COLOR: Updated to Google Blue (#1A73E8)
        primary: {
          DEFAULT: '#1A73E8', // Google Blue (New Primary)
          50: '#ebf3ff',
          100: '#dbe9ff',
          200: '#bcd7ff',
          300: '#9cc3ff',
          400: '#6fa8ff',
          500: '#3f8fff',
          600: '#1A73E8', // Aligning 600 to the new DEFAULT hex
          700: '#1a4db4',
          800: '#133a88',
          900: '#0b2658'
        },
        // 3. SECONDARY COLOR: Kept as the semantic success color (Emerald)
        secondary: {
          DEFAULT: '#10b981' // Emerald (Semantic Success)
        },
        // 4. ACCENT COLOR: Updated to Android Green (#3DDC84) - The new brand highlight
        accent: {
          DEFAULT: '#3DDC84' // Android Green (New Accent/Highlight)
        },
        // 5. SEMANTIC COLORS (Optional, but useful for Tailwind utilities)
        // These align with the semantic colors in design.json
        success: '#10B981', 
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      // 6. FONT FAMILY: Kept as Roboto
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'ui-sans-serif', 'system-ui']
      },
      // 7. ANIMATIONS: Keep only generic/necessary animations, remove old aesthetic ones
      animation: {
        // Kept: Generic gradient shift animation
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'fade-in-down': 'fadeInDown 0.3s ease-out forwards',
        // Removed: 'float-slow', 'float-medium', 'float-fast' (Not part of new aesthetic)
        // Removed: 'pulse-glow', 'pulse-subtle', 'pulse-slow' (Not part of new aesthetic)
        // Kept: Generic gradient text animation
        'gradient-text': 'gradient-text 5s ease infinite',
        // Removed: 'typewriter'
        
        // Add Shimmer/FadeInUp from design.json for component animations
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'fadeInUp': 'fadeInUp 0.5s ease-out',
        'scaleInBounce': 'scaleInBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      // 8. KEYFRAMES: Keep only generic/necessary keyframes
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        },
        'gradient-text': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        },
        // Added keyframes from design.json for component animations
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        'fadeInUp': {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        'scaleInBounce': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      // 9. BACKDROP BLUR: Kept as is
      backdropBlur: {
        xs: '2px',
      }
    }
  },
  // 10. PLUGINS: Kept as is
  plugins: [],
}