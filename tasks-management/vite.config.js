import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://172.16.31.228:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          // Vite 8 / rolldown requires manualChunks as a function
          manualChunks(id) {
            if (id.includes('react-router-dom') || id.includes('react-router')) return 'router'
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts'
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react'
          },
        },
      },
    },

    // Vite 8 — explicit dependency pre-bundling hints
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'chart.js'],
    },
  }
})
