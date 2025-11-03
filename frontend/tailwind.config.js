/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta futurista
        futura: {
          // Cores principais
          primary: '#00F5FF',      // Cyan brilhante
          secondary: '#7B2CBF',     // Roxo profundo
          accent: '#FF006E',        // Rosa vibrante
          success: '#00FF88',      // Verde neon
          warning: '#FFB800',       // Amarelo ouro
          danger: '#FF3366',       // Vermelho neon
          
          // Escala de cinzas
          'gray-50': '#0A0A0F',
          'gray-100': '#14141F',
          'gray-200': '#1E1E2F',
          'gray-300': '#28283F',
          'gray-400': '#32324F',
          'gray-500': '#3C3C5F',
          'gray-600': '#505070',
          'gray-700': '#646480',
          'gray-800': '#787890',
          'gray-900': '#8C8CA0',
          
          // Backgrounds
          bg: '#0A0A0F',
          surface: '#14141F',
          'surface-hover': '#1E1E2F',
          elevated: '#1E1E2F',
          border: '#28283F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0, 245, 255, 0.4), 0 0 40px rgba(0, 245, 255, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(0, 245, 255, 0.6), 0 0 60px rgba(0, 245, 255, 0.4)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 245, 255, 0.4), 0 0 40px rgba(0, 245, 255, 0.2)',
        'glow-secondary': '0 0 20px rgba(123, 44, 191, 0.4), 0 0 40px rgba(123, 44, 191, 0.2)',
        'glow-accent': '0 0 20px rgba(255, 0, 110, 0.4), 0 0 40px rgba(255, 0, 110, 0.2)',
        'glow-success': '0 0 20px rgba(0, 255, 136, 0.4), 0 0 40px rgba(0, 255, 136, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(0, 245, 255, 0.1)',
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}