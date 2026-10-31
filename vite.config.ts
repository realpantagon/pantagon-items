import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['box-red.png'],
      manifest: {
        name: 'Items',
        short_name: 'Items',
        description: 'Track your items, costs, and daily burn rate',
        theme_color: '#08090d',
        background_color: '#08090d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/box-red.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // API responses must come from the Worker, never the SPA shell
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Offline fallback: last item list stays readable without signal
            urlPattern: ({ url }) => url.pathname.startsWith('/api/items'),
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'items-api',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})

