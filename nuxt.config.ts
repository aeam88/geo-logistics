// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

import "./server/utils/env";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: 3000
  },
  modules: ['@nuxt/ui'],
  css: ['./app/assets/css/main.css'],

  // PWA Configuration
  app: {
    head: {
      title: 'GeoLogistics',
      meta: [
        { name: 'theme-color', content: '#10b981' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.json' },
      ],
    },
  },

  // Nitro config
  nitro: {
    serveStatic: true,
    // Security headers
    routeRules: {
      '**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
        },
      },
      // CORS para API
      '/api/**': {
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bypass-auth',
          'Access-Control-Allow-Credentials': 'true',
        },
      },
      // Cache para assets estáticos
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
      '/sw.js': {
        headers: {
          'Cache-Control': 'no-cache',
          'Service-Worker-Allowed': '/',
        },
      },
    },
  },

  vite: {
    server: {
      hmr: {
        host: '127.0.0.1',
      }
    },
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'better-auth/vue',
        'leaflet',
        'leaflet-draw',
        'leaflet.markercluster',
        'vue-virtual-scroller',
      ]
    }
  }
})
