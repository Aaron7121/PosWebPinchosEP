import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    ...(command === 'serve' && process.env.VITE_LOCAL_HTTP !== 'true'
      ? [basicSsl()]
      : []),
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Permite probar la instalación de la PWA también con `vite dev`, no solo en build/preview
      devOptions: { enabled: true, type: 'module' },
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
        icons: [
          {
            src: '/logoNegocio.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logoNegocio.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
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
}))
