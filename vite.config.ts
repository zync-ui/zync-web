import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    // Explicitly put .ts/.tsx BEFORE .js/.jsx so TypeScript source files always
    // take priority over any leftover .js stubs when both share the same basename.
    extensions: ['.mts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  },

  server: {
    host: '0.0.0.0',
    port: 10000,
    proxy: {
      // Forward all /api requests to the .NET backend during development.
      // This avoids CORS issues and ensures the Vite dev server never
      // intercepts API calls with its own HTML fallback handler.
      '/api': {
        target: 'http://localhost:4521',
        changeOrigin: true,
      },
    },
  },
})

