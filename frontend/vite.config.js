import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeOfflineWorker } from './scripts/build-pwa.js'

let base = '/'
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'habiton-offline',
      configResolved(config) {
        base = config.base
      },
      closeBundle() {
        return writeOfflineWorker(base)
      },
    },
  ],
  server: {
    host: true,
    proxy: {
      '/api/': {
        target: 'http://127.0.0.1:8081',
        rewrite: (url) => url.replace(/^\/api\//, '/'),
      },
    },
  },
})
