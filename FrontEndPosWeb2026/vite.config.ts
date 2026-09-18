import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Incluye los audios en el precache para que suenen sin conexión
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp3,wav,ogg}'],
      },
      manifest: {
        name: 'POS Pinchos el Parqueadero',
        short_name: 'POS',
        description: 'Punto de venta gastronómico',
        theme_color: '#F97316',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/uploads': 'http://localhost:8080',
    },
  },
})
