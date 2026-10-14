import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: process.env.PORT || 5173,
    host: '0.0.0.0',
    allowedHosts: true, // <-- Yeh line Render host block ko allow karegi
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