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
        // Cores retro de TV (anos 80-90)
        tv: {
          // Verde fosforescente (texto de TV antiga)
          phosphor: '#39FF14',
          'phosphor-dark': '#2ECC40',
          'phosphor-light': '#7FFF00',
          // Bege/marrom da carcaça
          beige: '#D4A574',
          'beige-dark': '#B8946F',
          'beige-light': '#E8C9A0',
          // Preto profundo da tela
          black: '#0A0A0A',
          screen: '#1A1A1A',
          'screen-dark': '#0F0F0F',
          // Vermelho retro (botões, alertas)
          red: '#FF4444',
          'red-dark': '#CC0000',
          // Azul retro (links, destaques)
          blue: '#4A90E2',
          'blue-dark': '#357ABD',
          // Amarelo retro (avisos)
          yellow: '#FFD700',
          'yellow-dark': '#CCAA00',
          // Cinza dos controles
          gray: '#8B8B8B',
          'gray-dark': '#5A5A5A',
          'gray-light': '#B0B0B0',
        },
        retro: {
          bg: '#1A1A1A',
          surface: '#2A2A2A',
          border: '#4A4A4A',
          text: '#39FF14',
          textDark: '#2ECC40',
          accent: '#FF4444',
          secondary: '#4A90E2',
        },
      },
      fontFamily: {
        // Fontes retro monospace
        mono: ['Courier New', 'Courier', 'monospace'],
        retro: ['Courier New', 'Courier', 'monospace', 'VT323', 'Share Tech Mono'],
        sans: ['Courier New', 'Courier', 'monospace', 'system-ui', 'sans-serif'],
      },
      animation: {
        // Efeitos CRT
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'static': 'static 0.5s steps(4) infinite',
        'glitch': 'glitch 0.3s ease-in-out infinite',
        'tv-on': 'tvOn 1s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Animações normais
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
        static: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '20px 20px' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        tvOn: {
          '0%': { opacity: '0', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
      },
      boxShadow: {
        'tv-glow': '0 0 20px rgba(57, 255, 20, 0.3), inset 0 0 20px rgba(57, 255, 20, 0.1)',
        'tv-glow-red': '0 0 20px rgba(255, 68, 68, 0.3), inset 0 0 20px rgba(255, 68, 68, 0.1)',
        'tv-glow-blue': '0 0 20px rgba(74, 144, 226, 0.3), inset 0 0 20px rgba(74, 144, 226, 0.1)',
        'retro-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.5), inset 0 -2px 4px rgba(255, 255, 255, 0.1)',
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}