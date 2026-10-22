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
  server: { host: true },
})
