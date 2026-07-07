import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  build: {
    // Build ra backend/public để đóng gói 1 image Docker.
    outDir: '../backend/public',
    emptyOutDir: true,
  },
});
