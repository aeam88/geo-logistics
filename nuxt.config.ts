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

  app: {
    head: {
      title: 'GeoLogistics',
      meta: [
        { name: 'theme-color', content: '#6366f1' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'apple-touch-icon', href: '/icon-192.svg' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
    },
  },

  nitro: {
    serveStatic: true,
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
      '/api/**': {
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bypass-auth',
          'Access-Control-Allow-Credentials': 'true',
        },
      },
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
