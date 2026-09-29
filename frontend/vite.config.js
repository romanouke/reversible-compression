import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Inside compose the API is the `backend` service; running `npm run dev` on
  // the host it is on localhost. VITE_API_TARGET lets each case pick.
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8000'

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
      extensions: ['.js', '.jsx', '.json', '.css'],
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      proxy: {
        // Keep the websocket route ahead of the HTTP one so the upgrade
        // headers are not stripped by the plain proxy.
        '/api/ws': { target: apiTarget, ws: true, changeOrigin: true },
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
