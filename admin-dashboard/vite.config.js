import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase/') || id.includes('@firebase/') || id.includes('/src/firebase.')) return 'firebase';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler') || id.includes('node_modules/recharts') || id.includes('node_modules/lucide-react') || id.includes('node_modules/d3-')) return 'vendor';
        },
      },
    },
  },
})
