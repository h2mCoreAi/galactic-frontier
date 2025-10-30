import { defineConfig } from 'vite'

export default defineConfig({
  root: 'single-player/src',
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/game-data': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: '../../dist',
    sourcemap: true,
    minify: true
  },
  css: {
    devSourcemap: true
  }
})
