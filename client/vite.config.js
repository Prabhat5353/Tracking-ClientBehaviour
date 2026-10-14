import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/dashboard/',
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/store': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/tracker': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
