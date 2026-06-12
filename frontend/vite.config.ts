import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuracao enxuta do Vite (sem PWA/service worker).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
