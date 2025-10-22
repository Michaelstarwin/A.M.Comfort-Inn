import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),
    
  ],
  theme: {
    extend: {
      // Add your custom fonts here
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'], 
      },
      // Add your custom colors
      colors: {
        'primary-blue': '#030389',
        'orange': {
          '500': '#ff6b35',
          '600': '#e55a2a',
        },
        'text-dark': '#2c3e50',
      },
      // Z-index for navbar
      zIndex: {
        '1000': '1000',
      },
      // --- ADD THIS SECTION FOR THE ANIMATION ---
      keyframes: {
        kenburns: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        kenburns: 'kenburns 20s ease-in-out infinite alternate',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
      }
      // --- END OF NEW SECTION ---
    },
  },
})
