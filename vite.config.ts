import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
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
