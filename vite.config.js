// vite.config.js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // --- ADD THIS SERVER CONFIGURATION BLOCK ---
  server: {
    proxy: {
      // Any request that starts with "/api" will be proxied
      '/api': {
        // Forward it to the backend server that `vercel dev` is running
        target: 'http://localhost:3000', 
        changeOrigin: true,
      },
    },
  },
  // -----------------------------------------
})