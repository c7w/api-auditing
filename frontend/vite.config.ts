import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0', // 监听所有网络接口
    port: 20005,
    proxy: {
      '/api': {
        target: 'http://localhost:20004',
        changeOrigin: true,
      },
      '/v1': {
        target: 'http://localhost:20004',
        changeOrigin: true,
      },
    },
  },
})
