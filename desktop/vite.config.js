import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the built files load correctly from file:// inside Electron
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5234 },
})
