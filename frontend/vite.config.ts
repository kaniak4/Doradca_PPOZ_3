// vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
    return {
      server: {
        port: Number(env.VITE_PORT) || 5175,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: env.VITE_API_BASE_URL || 'http://localhost:3003',
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      // API Key jest teraz tylko w backendzie - nie eksportujemy go do frontendu
      // Vite automatycznie obsługuje zmienne środowiskowe z prefiksem VITE_
      envPrefix: 'VITE_',
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
