import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Note: Using Tailwind CSS via PostCSS for now
// Tailwind v4 Vite plugin will be added once it's stable
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/config': path.resolve(__dirname, './src/config'),
    },
  },
});
