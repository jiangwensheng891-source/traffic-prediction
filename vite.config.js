import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Vite配置文件
export default defineConfig({
  plugins: [vue()],
  // 本地开发时使用根路径，生产构建时使用GitHub Pages路径
  base: process.env.NODE_ENV === 'production' ? '/traffic-prediction/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  }
})
