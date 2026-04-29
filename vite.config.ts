import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          workbox: {
            maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10MB
          },
          manifest: {
            name: 'Currency Converter',
            short_name: 'CurrencyConv',
            description: 'A modern, AI-powered currency converter.',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
              {
                src: 'pwa-192x192.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
              },
              {
                src: 'pwa-512x512.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
              },
              {
                src: 'pwa-512x512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
