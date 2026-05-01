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
          includeAssets: ['app-icon-192.png', 'app-icon-512.png'],
          workbox: {
            maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB
            navigateFallbackDenylist: [/^\/api/]
          },
          manifest: {
            name: "Gia Hân's workspace",
            short_name: "Gia Hân's workspace",
            description: 'Ứng dụng Gia Hân Converter',
            theme_color: '#FFE4E1',
            background_color: '#ffffff',
            display: 'standalone',
            start_url: '/',
            id: '/',
            icons: [
              {
                src: '/app-icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/app-icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/app-icon-512.png',
                sizes: 'any',
                type: 'image/png',
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
